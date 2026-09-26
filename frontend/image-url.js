(function () {
    function getBackendOrigin() {
        try {
            return new URL(window.API_BASE || '/api', window.location.href).origin;
        } catch {
            return window.location.origin;
        }
    }

    window.imageUrl = function (value) {
        if (typeof value !== 'string' || !value.trim()) return '';

        const source = value.trim();
        const backendOrigin = getBackendOrigin();
        try {
            const parsed = new URL(source, `${backendOrigin}/`);
            if (parsed.protocol === 'https:') return parsed.href;
            if (parsed.protocol === 'http:') {
                if (window.location.protocol !== 'https:') return parsed.href;
                if (parsed.origin === backendOrigin) {
                    parsed.protocol = 'https:';
                    return parsed.href;
                }
            }
        } catch {
            return '';
        }
        return '';
    };
})();