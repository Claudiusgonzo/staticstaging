/// <reference path="../ast.ts" />
/// <reference path="../type_elaborate.ts" />

// The def/use table: for every use node ID, the corresponding definition (let
// or parameter) node ID.
type DefUseTable = number[];

// A procedure is a lambda-lifted function. It includes the original body of
// the function and the IDs of the parameters and the closed-over free
// variables used in the function.
interface Proc {
  id: number,  // or null for the main proc
  body: ExpressionNode,
  params: number[],
  free: number[],
  bound: number[],

  persists: number[],
  csr: number[],
};

interface ProgEscape {
  id: number,
  body: ExpressionNode,
}

// A Prog represents a quoted program. It's the quotation analogue of a Proc.
// Progs can have bound variables but not free variables.
interface Prog {
  id: number,
  body: ExpressionNode,
  annotation: string,
  bound: number[],

  // A list of references (lookup and assignment nodes) that refer to an
  // outer stage.
  csr: number[],

  // Plain lists of all the escapes in the program.
  persist: ProgEscape[],
  splice: ProgEscape[],

  // List of IDs of subprograms inside the program.
  subprograms: number[],
}

// A Scope marks the containing quote and function IDs for any node. Either
// "coordinate" may be null if the tree is outside of a function (in its
// current quote) or is top-level, outside of any quote.
interface Scope {
  func: number,
  quote: number,
};

// The mid-level IR structure.
interface CompilerIR {
  // The def/use table.
  defuse: DefUseTable;

  // The lambda-lifted Procs. We have all the Procs except main, indexed by
  // ID, and main separately.
  procs: Proc[];
  main: Proc;

  // The quote-lifted Progs. Again, the Progs are indexed by ID.
  progs: Prog[];

  // Association tables between Progs and their associated Procs. Also, a list
  // of Procs from the top level---not associated with any quote.
  toplevel_procs: number[];
  quoted_procs: number[][];

  // Type elaboration.
  type_table: TypeTable;

  // Names of externs, indexed by the `extern` expression ID.
  externs: string[];

  // Scopes for every tree node.
  scopes: Scope[],
}

function same_scope(scopes: Scope[], a: number, b: number): boolean {
  let a_scope = scopes[a];
  let b_scope = scopes[b];
  return a_scope.func === b_scope.func && a_scope.quote === b_scope.quote;
}

function cross_stage(scopes: Scope[], defid: number, useid: number): boolean {
  let def_scope = scopes[defid];
  let use_scope = scopes[useid];
  return def_scope.quote !== use_scope.quote;
}