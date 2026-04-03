var luauReady = false;
var Module = {};
Module.onRuntimeInitialized = () => {
    luauReady = true;
}

((Module) => {
    LUAU_CODE_HERE
})(Module);

browser.runtime.onInstalled.addListener(async () => {
    await browser.storage.sync.set({
        list: []
    });
});

browser.webRequest.onBeforeRequest.addListener(async (details) => {
    const url = details.url;

    const storage = await browser.storage.sync.get("list");
    const list = storage.list;

    var injectionScript = null;

    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (new RegExp(item.pattern).test(url))
            injectionScript = item.script;
    }

    if (injectionScript != null) {
        try {
            const response = await fetch(injectionScript);
            if (!response.ok) {
                console.warn("failed to make request to script url");
                injectionScript = null;
            }

            injectionScript = await response.text();
        } catch (error) {
            console.warn("failed to make request to script url: " + error);
            injectionScript = null;
        }
    }

    if (injectionScript == null)
        return {};

    if (!luauReady) {
        console.warn("luau has not yet been initialized!");
        return {};
    }

    const filter = browser.webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();

    const data = [];
    filter.ondata = (event) => {
        data.push(event.data);
    };

    filter.onstop = async (event) => {
        let str = "";
        if (data.length === 1) {
            str = decoder.decode(data[0]);
        } else {
            for (let i = 0; i < data.length; i++) {
                const stream = i !== data.length - 1;
                str += decoder.decode(data[i], { stream });
            }
        }

        var str_len = Module.lengthBytesUTF8(str) + 1;
        var str_ptr = Module._malloc(str_len);
        Module.stringToUTF8(str, str_ptr, str_len);
        try {
            Module.ccall("jsinjectionSetContents", null, ["number"], [str_ptr]);
        } finally {
            Module._free(str_ptr);
        }

        str_len = Module.lengthBytesUTF8(injectionScript) + 1;
        str_ptr = Module._malloc(str_len);
        Module.stringToUTF8(injectionScript, str_ptr, str_len);
        let err = "";
        try {
            err = Module.ccall("executeScript", "string", ["number"], [str_ptr]);
        } finally {
            Module._free(str_ptr);
        }
        if (err)
            console.warn(err);

        let result = Module.ccall("jsinjectionGetContents", "string", []);

        filter.write(encoder.encode(result));
        filter.close();
    };

    return {};
}, {urls: ["*://*/*"]}, ["blocking"]);
