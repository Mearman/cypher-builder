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

import type { CypherEnvironment } from "../Environment";
import type { NodeRef } from "../references/NodeRef";
import { Pattern } from "../pattern/Pattern";
import { SetClause } from "./sub-clauses/Set";
import { Clause } from "./Clause";
import { compileCypherIfExists } from "../utils/compile-cypher-if-exists";
import { WithReturn } from "./mixins/clauses/WithReturn";
import { mixin } from "./utils/mixin";
import { WithSet } from "./mixins/sub-clauses/WithSet";
import { WithPathAssign } from "./mixins/WithPathAssign";

export interface Create extends WithReturn, WithSet, WithPathAssign {}

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/create/)
 * @group Clauses
 */
@mixin(WithReturn, WithSet, WithPathAssign)
export class Create extends Clause {
    private pattern: Pattern;

    constructor(pattern: NodeRef | Pattern) {
        super();
        if (pattern instanceof Pattern) {
            this.pattern = pattern;
        } else {
            this.pattern = new Pattern(pattern);
        }

        this.setSubClause = new SetClause(this);
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const pathCypher = this.compilePath(env);
        const patternCypher = this.pattern.getCypher(env);

        const setCypher = compileCypherIfExists(this.setSubClause, env, { prefix: "\n" });
        const returnCypher = compileCypherIfExists(this.returnStatement, env, { prefix: "\n" });

        return `CREATE ${pathCypher}${patternCypher}${setCypher}${returnCypher}`;
    }
}
