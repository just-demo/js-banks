import assert from './assert';
import regex from './regex';
import arrays from './arrays';

export default {

    siteName(site) {
        return site.replace(/(?<!:|:\/)\/(?!ukraine$).*/g, '');
    },

    extractBankPureName(bankFullName) {
        let name = bankFullName;
        name = regex.findSingleValue(name, /.*«(.+?)»/) || name;
        name = regex.findSingleValue(name, /.*"(.+?)"/) || name;
        name = regex.findSingleValue(name, /.*\s'(.+?)'/) || name;
        assert.notEquals('Full name is pure name', name, bankFullName);
        return this.normalize(name);
    },

    normalize(name) {
        return name.trim().toUpperCase()
            .replace(/`/g, '\'')
            .replace(/\s+/g, ' ')
            .replace(/\s*-\s*/g, '-')
            // TODO: replace "( " => "(" as well
            .replace(/^БАНК /, '')
            .replace(/ БАНК$/, '');
    },

    removeTags(name) {
        return name.replace(/<[^>]*>/g, '');
    },

    // TODO: move to a better place?
    // Just for predictable sorting taking into account asynchrony being introduced
    compareNames(a, b) {
        return arrays.compare(a.names, b.names);
    }
};