// @vitest-environment jsdom
import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import FinPolicyStudioPage from './FinPolicyStudioPage'
import { usePolicyWorkspaceStore } from '@/stores/policy-workspace.store'
import { useStudioStore } from '@/stores/studio.store'

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, onMount }: any) => {
    React.useEffect(() => {
      onMount?.(
        {
          layout: vi.fn(),
          onDidChangeCursorPosition: vi.fn(),
          trigger: vi.fn(),
          focus: vi.fn(),
        },
        { editor: { setTheme: vi.fn() } },
      )
    }, [onMount])

    return (
      <textarea
        aria-label="Mock Monaco Editor"
        data-testid="mock-monaco-editor"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    )
  },
  useMonaco: () => ({
    editor: { setTheme: vi.fn(), defineTheme: vi.fn() },
    languages: {
      getLanguages: () => [{ id: 'fpl' }],
      register: vi.fn(),
      setLanguageConfiguration: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
      registerCompletionItemProvider: vi.fn(),
      CompletionItemKind: { Keyword: 14 },
    },
  }),
}))

vi.mock('@/services/compiler.service', () => ({
  compilerService: {
    compile: vi.fn(() => Promise.reject(new Error('Use local compiler in frontend test'))),
    run: vi.fn(() => Promise.reject(new Error('Use local FPVM in frontend test'))),
  },
}))

const fplPolicy = `POLICY FacultyFplScholarship
INPUT
  gpa: decimal
  familyIncome: decimal
  communityHours: int
OUTPUT
  scholarshipAmount: decimal
  reviewScore: int
WHEN
  gpa >= 8.5 AND familyIncome <= 45000 AND communityHours >= 40
THEN
  APPROVE
  SET scholarshipAmount = 25000
  SET reviewScore = 95
ELSE
  REJECT
  SET scholarshipAmount = 0
  SET reviewScore = 20
END`

const cPolicy = `int baseSalary;
int performanceRating;
int tenureYears;
int bonusAmount;
int payoutBand;

int main() {
  if (baseSalary >= 70000 && performanceRating >= 4 && tenureYears >= 2) {
    approve();
    bonusAmount = 18000;
    payoutBand = 1;
  } else {
    reject();
    bonusAmount = 0;
    payoutBand = 0;
  }
}`

function renderStudio() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <FinPolicyStudioPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function openPolicy(sourceCode: string, name: string, title: string) {
  const policy = usePolicyWorkspaceStore.getState().createPolicy({
    name,
    sourceCode,
    folderId: 'fld-banking',
  })
  useStudioStore.getState().openPolicyTab(policy.id, title)
  return policy
}

async function runVisiblePolicy(inputJson: Record<string, number>) {
  fireEvent.click(screen.getByTestId('bottom-tab-execution'))

  const runtimeInput = screen.getByLabelText(/input data json/i)
  fireEvent.change(runtimeInput, {
    target: { value: JSON.stringify(inputJson, null, 2) },
  })

  fireEvent.click(screen.getByTestId('studio-compile-btn'))
  fireEvent.click(screen.getByTestId('studio-execute-btn'))
}

describe('Studio frontend policy flow', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    useStudioStore.setState({
      developerMode: true,
      developerPanelCollapsed: false,
      activeDeveloperTab: 'pipeline',
      activeBottomTab: 'execution',
      compilerOutputLines: [],
      studioLogs: [],
      terminalLines: [],
    })
  })

  it('runs a new .fpl policy and shows correct result plus compiler phases', async () => {
    await openPolicy(fplPolicy, 'FacultyFplScholarship', 'FacultyFplScholarship.fpl')
    renderStudio()

    await runVisiblePolicy({
      gpa: 9.2,
      familyIncome: 38000,
      communityHours: 52,
    })

    await waitFor(() => {
      expect(screen.getAllByText('FacultyFplScholarship').length).toBeGreaterThan(0)
      expect(screen.getAllByText('APPROVE').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/scholarshipAmount/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/25000/).length).toBeGreaterThan(0)
    })

    const visualizer = screen.getByTestId('studio-developer-panel')
    expect(within(visualizer).getByText('COMPILER VISUALIZER')).toBeInTheDocument()
    expect(within(visualizer).getByText('FPL Mode')).toBeInTheDocument()
    expect(within(visualizer).getByText('Lexer')).toBeInTheDocument()
    expect(within(visualizer).getByText('Parser')).toBeInTheDocument()
    expect(within(visualizer).getByText('AST')).toBeInTheDocument()
    expect(within(visualizer).getByText('Semantic')).toBeInTheDocument()
    expect(within(visualizer).getByText('Symbols')).toBeInTheDocument()
    expect(within(visualizer).getByText('IR/TAC')).toBeInTheDocument()
    expect(within(visualizer).getByText('Optimizer')).toBeInTheDocument()
    expect(within(visualizer).getByText('FPVM')).toBeInTheDocument()
  })

  it('runs a new .c policy and shows correct result plus C compiler phases', async () => {
    await openPolicy(cPolicy, 'FacultyCBonusPolicy', 'FacultyCBonusPolicy.c')
    renderStudio()

    await runVisiblePolicy({
      baseSalary: 92000,
      performanceRating: 5,
      tenureYears: 4,
    })

    await waitFor(() => {
      expect(screen.getAllByText('FacultyCBonusPolicy').length).toBeGreaterThan(0)
      expect(screen.getAllByText('APPROVE').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/bonusAmount/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/18000/).length).toBeGreaterThan(0)
    })

    const visualizer = screen.getByTestId('studio-developer-panel')
    expect(within(visualizer).getByText('C Policy Mode')).toBeInTheDocument()
    expect(within(visualizer).getByText('C subset map')).toBeInTheDocument()
    expect(within(visualizer).getByText('Three-address code')).toBeInTheDocument()
    expect(within(visualizer).getByText('Execution trace')).toBeInTheDocument()
  })
})
