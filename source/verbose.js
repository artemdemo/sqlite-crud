'use strict';

let verbose = true;

/**
 * Print or not log of the module too the console
 * @param newVerbose {Boolean}
 */
const setVerbose = (newVerbose) => {
    verbose = newVerbose
};

const getVerbose = () => {
    return verbose;
};

module.exports = {
    setVerbose,
    getVerbose
};
