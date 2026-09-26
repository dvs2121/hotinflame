(function () {
    function getBackendOrigin() {
        try {
            return new URL(window.API_BASE || '/api', window.location.href).origin;
        } catch {
            return window.location.origin;
        }
    }

    window.resolveImageUrl = function (value) {
        if (typeof value !== 'string' || !value.trim()) return '';

        const source = value.trim();
        if (/^https:\/\//i.test(source)) return source;
        if (source.startsWith('//')) return '';
        const backendOrigin = getBackendOrigin();
        try {
            if (/^http:\/\//i.test(source)) {
                const parsed = new URL(source);
                if (window.location.protocol !== 'https:') return parsed.href;
                if (parsed.origin === backendOrigin) {
                    parsed.protocol = 'https:';
                    return parsed.href;
                }
                return '';
            }
            const relativePath = source.startsWith('/') ? source : `/${source}`;
            return new URL(relativePath, `${backendOrigin}/`).href;
        } catch {
            return '';
        }
    };

    window.imageUrl = window.resolveImageUrl;

    window.optimizedImageUrl = function (value, width = 900) {
        const resolved = window.resolveImageUrl(value);
        if (!resolved) return '';
        try {
            const parsed = new URL(resolved);
            const marker = '/image/upload/';
            const markerIndex = parsed.pathname.indexOf(marker);
            if (parsed.protocol !== 'https:' || markerIndex < 0) return resolved;
            const remainder = parsed.pathname.slice(markerIndex + marker.length);
            if (remainder.split('/')[0].includes(',')) return resolved;
            const boundedWidth = Math.max(100, Math.min(2000, Math.round(width)));
            parsed.pathname = `${parsed.pathname.slice(0, markerIndex + marker.length)}f_auto,q_auto,w_${boundedWidth},c_limit/${remainder}`;
            return parsed.href;
        } catch {
            return resolved;
        }
    };
})();