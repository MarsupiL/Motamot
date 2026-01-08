const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function(eleventyConfig) {

    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.addPassthroughCopy("src/**/*.png");
    return {
        dir: {
            input: 'src'
        }
    }
};
