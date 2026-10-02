"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Intermediate Representation (IR) Barrel Exports
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIR = exports.IRGenerator = exports.IRVisitor = exports.IRSerializer = exports.IRPrettyPrinter = exports.IRValidator = exports.CFGBuilder = exports.ControlFlowBuilder = exports.BasicBlockBuilder = exports.IndirectTripleGenerator = exports.TripleGenerator = exports.QuadrupleGenerator = exports.TACGenerator = exports.IRBuilder = exports.InstructionBuilder = exports.IRFactory = exports.LabelManager = exports.LabelGenerator = exports.TemporaryVariableManager = exports.TemporaryVariableGenerator = void 0;
var temporary_manager_1 = require("./temporary-manager");
Object.defineProperty(exports, "TemporaryVariableGenerator", { enumerable: true, get: function () { return temporary_manager_1.TemporaryVariableGenerator; } });
Object.defineProperty(exports, "TemporaryVariableManager", { enumerable: true, get: function () { return temporary_manager_1.TemporaryVariableManager; } });
var label_manager_1 = require("./label-manager");
Object.defineProperty(exports, "LabelGenerator", { enumerable: true, get: function () { return label_manager_1.LabelGenerator; } });
Object.defineProperty(exports, "LabelManager", { enumerable: true, get: function () { return label_manager_1.LabelManager; } });
var ir_factory_1 = require("./ir-factory");
Object.defineProperty(exports, "IRFactory", { enumerable: true, get: function () { return ir_factory_1.IRFactory; } });
var instruction_builder_1 = require("./instruction-builder");
Object.defineProperty(exports, "InstructionBuilder", { enumerable: true, get: function () { return instruction_builder_1.InstructionBuilder; } });
Object.defineProperty(exports, "IRBuilder", { enumerable: true, get: function () { return instruction_builder_1.IRBuilder; } });
var representations_1 = require("./representations");
Object.defineProperty(exports, "TACGenerator", { enumerable: true, get: function () { return representations_1.TACGenerator; } });
Object.defineProperty(exports, "QuadrupleGenerator", { enumerable: true, get: function () { return representations_1.QuadrupleGenerator; } });
Object.defineProperty(exports, "TripleGenerator", { enumerable: true, get: function () { return representations_1.TripleGenerator; } });
Object.defineProperty(exports, "IndirectTripleGenerator", { enumerable: true, get: function () { return representations_1.IndirectTripleGenerator; } });
var basic_block_builder_1 = require("./basic-block-builder");
Object.defineProperty(exports, "BasicBlockBuilder", { enumerable: true, get: function () { return basic_block_builder_1.BasicBlockBuilder; } });
var cfg_builder_1 = require("./cfg-builder");
Object.defineProperty(exports, "ControlFlowBuilder", { enumerable: true, get: function () { return cfg_builder_1.ControlFlowBuilder; } });
Object.defineProperty(exports, "CFGBuilder", { enumerable: true, get: function () { return cfg_builder_1.CFGBuilder; } });
var ir_validator_1 = require("./ir-validator");
Object.defineProperty(exports, "IRValidator", { enumerable: true, get: function () { return ir_validator_1.IRValidator; } });
var ir_pretty_printer_1 = require("./ir-pretty-printer");
Object.defineProperty(exports, "IRPrettyPrinter", { enumerable: true, get: function () { return ir_pretty_printer_1.IRPrettyPrinter; } });
var ir_serializer_1 = require("./ir-serializer");
Object.defineProperty(exports, "IRSerializer", { enumerable: true, get: function () { return ir_serializer_1.IRSerializer; } });
var ir_generator_1 = require("./ir-generator");
Object.defineProperty(exports, "IRVisitor", { enumerable: true, get: function () { return ir_generator_1.IRVisitor; } });
Object.defineProperty(exports, "IRGenerator", { enumerable: true, get: function () { return ir_generator_1.IRGenerator; } });
Object.defineProperty(exports, "generateIR", { enumerable: true, get: function () { return ir_generator_1.generateIR; } });
//# sourceMappingURL=index.js.map