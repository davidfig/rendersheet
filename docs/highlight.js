const forkMe = require('fork-me-github')
const hljs = require('highlight.js/lib/core')
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'))

module.exports = function highlight(url)
{
    var client = new XMLHttpRequest()
    client.open('GET', 'code.js')
    client.onreadystatechange = function()
    {
        if (client.readyState !== 4) return
        var code = document.getElementById('code')
        code.textContent = client.responseText
        hljs.highlightElement(code)
    }
    client.send()

    forkMe(url, { background: 'blue' })
}

// for eslint
/* globals window, XMLHttpRequest, document */