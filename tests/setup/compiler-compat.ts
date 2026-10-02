import { IRFactory } from '../../compiler/src/ir/ir-factory'

const factoryAny = IRFactory as unknown as Record<string, unknown>

if (!factoryAny.label) {
  factoryAny.label = IRFactory.createLabelOperand.bind(IRFactory)
}
if (!factoryAny.constant) {
  factoryAny.constant = IRFactory.createConstantOperand.bind(IRFactory)
}
if (!factoryAny.variable) {
  factoryAny.variable = IRFactory.createVariableOperand.bind(IRFactory)
}
if (!factoryAny.temporary) {
  factoryAny.temporary = IRFactory.createTemporaryOperand.bind(IRFactory)
}
if (!factoryAny.func) {
  factoryAny.func = IRFactory.createFunctionOperand.bind(IRFactory)
}
if (!factoryAny.policy) {
  factoryAny.policy = IRFactory.createPolicyOperand.bind(IRFactory)
}
