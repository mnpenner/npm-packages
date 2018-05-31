import dump from '../dump';
// import {Command} from '../console';

export default {
    name: "export",
    description: "Export the current database schema",
    async execute(args, opts) {
        dump('do things');
    }
}