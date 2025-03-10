/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Pattern } from "../pattern/Pattern";
import { Clause } from "./Clause";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import { WithReturn } from "./mixins/clauses/WithReturn";
import { mixin } from "./utils/mixin";
import { WithWhere } from "./mixins/sub-clauses/WithWhere";
import { WithSet } from "./mixins/sub-clauses/WithSet";
import { WithWith } from "./mixins/clauses/WithWith";
import { WithPathAssign } from "./mixins/WithPathAssign";
import type { PropertyRef } from "../references/PropertyRef";
import { RemoveClause } from "./sub-clauses/Remove";
import type { CypherEnvironment } from "../Environment";
import type { NodeRef } from "../references/NodeRef";
import { WithDelete } from "./mixins/sub-clauses/WithDelete";

export interface Match extends WithReturn, WithWhere, WithSet, WithWith, WithPathAssign, WithDelete {}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/match/)
 * @group Clauses
 */
@mixin(WithReturn, WithWhere, WithSet, WithWith, WithPathAssign, WithDelete)
export class Match extends Clause {
    private pattern: Pattern;
    private removeClause: RemoveClause | undefined;
    private _optional = false;

    constructor(pattern: NodeRef | Pattern) {
        super();
        if (pattern instanceof Pattern) {
            this.pattern = pattern;
        } else {
            this.pattern = new Pattern(pattern);
        }
    }

    public remove(...properties: PropertyRef[]): this {
        this.removeClause = new RemoveClause(this, properties);
        return this;
    }

    /** Makes the clause an OPTIONAL MATCH
     * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/optional-match/)
     * @example
     * ```ts
     * new Cypher.Match(new Node({labels: ["Movie"]})).optional();
     * ```
     * _Cypher:_
     * ```cypher
     * OPTIONAL MATCH (this:Movie)
     * ```
     */
    public optional(): this {
        this._optional = true;
        return this;
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const pathAssignStr = this.compilePath(env);

        const patternCypher = this.pattern.getCypher(env);

        const whereCypher = compileCypherIfExists(this.whereSubClause, env, { prefix: "\n" });
        const returnCypher = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });
        const setCypher = compileCypherIfExists(this.setSubClause, env, { prefix: "\n" });
        const withCypher = compileCypherIfExists(this.withStatement, env, { prefix: "\n" });
        const deleteCypher = compileCypherIfExists(this.deleteClause, env, { prefix: "\n" });
        const removeCypher = compileCypherIfExists(this.removeClause, env, { prefix: "\n" });
        const optionalMatch = this._optional ? "OPTIONAL " : "";

        return `${optionalMatch}MATCH ${pathAssignStr}${patternCypher}${whereCypher}${setCypher}${removeCypher}${deleteCypher}${withCypher}${returnCypher}`;
    }
}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/optional-match/)
 * @group Clauses
 */
export class OptionalMatch extends Match {
    constructor(pattern: NodeRef | Pattern) {
        super(pattern);
        this.optional();
    }
}
