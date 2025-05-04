import { Exception } from "../../utils/exception";

export class MigrationAccountNotFound extends Exception {
    constructor() {
        super('Migration account does not exist');
    }
}