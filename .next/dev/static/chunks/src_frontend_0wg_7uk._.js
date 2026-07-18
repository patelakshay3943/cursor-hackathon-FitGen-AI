(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/frontend/shared/constants/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ROUTES",
    ()=>ROUTES
]);
const ROUTES = {
    home: "/",
    login: "/login",
    register: "/register",
    products: "/products",
    orders: "/orders",
    api: {
        welcome: "/api/welcome"
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/frontend/api/welcome.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchWelcome",
    ()=>fetchWelcome
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$shared$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/frontend/shared/constants/index.ts [app-client] (ecmascript)");
;
async function fetchWelcome() {
    const res = await fetch(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$shared$2f$constants$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ROUTES"].api.welcome);
    if (!res.ok) {
        throw new Error("Failed to load welcome message");
    }
    return res.json();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/frontend/components/WelcomeBanner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WelcomeBanner",
    ()=>WelcomeBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$api$2f$welcome$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/frontend/api/welcome.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function WelcomeBanner() {
    _s();
    const [welcome, setWelcome] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WelcomeBanner.useEffect": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$api$2f$welcome$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchWelcome"])().then(setWelcome).catch({
                "WelcomeBanner.useEffect": (err)=>setError(err.message)
            }["WelcomeBanner.useEffect"]);
        }
    }["WelcomeBanner.useEffect"], []);
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "mt-3 text-sm text-red-600 dark:text-red-400",
            children: [
                "API error: ",
                error
            ]
        }, void 0, true, {
            fileName: "[project]/src/frontend/components/WelcomeBanner.tsx",
            lineNumber: 19,
            columnNumber: 7
        }, this);
    }
    if (!welcome) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "mt-3 text-sm text-zinc-500 dark:text-zinc-400",
            children: "Loading welcome message…"
        }, void 0, false, {
            fileName: "[project]/src/frontend/components/WelcomeBanner.tsx",
            lineNumber: 27,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm font-medium text-emerald-900 dark:text-emerald-100",
                children: welcome.message
            }, void 0, false, {
                fileName: "[project]/src/frontend/components/WelcomeBanner.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-xs text-emerald-700 dark:text-emerald-300",
                children: [
                    "API: ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        className: "rounded bg-emerald-100 px-1 dark:bg-emerald-900",
                        children: "GET /api/welcome"
                    }, void 0, false, {
                        fileName: "[project]/src/frontend/components/WelcomeBanner.tsx",
                        lineNumber: 39,
                        columnNumber: 14
                    }, this),
                    " · ",
                    "v",
                    welcome.version
                ]
            }, void 0, true, {
                fileName: "[project]/src/frontend/components/WelcomeBanner.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/frontend/components/WelcomeBanner.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
_s(WelcomeBanner, "8MPdy/tpxvarB76mSrRWWrOL7Xc=");
_c = WelcomeBanner;
var _c;
__turbopack_context__.k.register(_c, "WelcomeBanner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/frontend/modules/product/api/catalog.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getProductById",
    ()=>getProductById,
    "getStaticProducts",
    ()=>getStaticProducts
]);
const STATIC_PRODUCTS = [
    {
        id: "p1",
        name: "Notebook",
        priceCents: 899,
        description: "Lined pages, static catalog entry."
    },
    {
        id: "p2",
        name: "Mug",
        priceCents: 1299,
        description: "Ceramic, demo only."
    },
    {
        id: "p3",
        name: "Sticker pack",
        priceCents: 499,
        description: "Assorted shapes."
    }
];
function getStaticProducts() {
    return STATIC_PRODUCTS;
}
function getProductById(id) {
    return STATIC_PRODUCTS.find((p)=>p.id === id);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/frontend/modules/product/hooks/useProducts.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProducts",
    ()=>useProducts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$modules$2f$product$2f$api$2f$catalog$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/frontend/modules/product/api/catalog.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function useProducts() {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useProducts.useMemo": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$modules$2f$product$2f$api$2f$catalog$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStaticProducts"])()
    }["useProducts.useMemo"], []);
}
_s(useProducts, "nwk+m61qLgjDVUp4IGV/072DDN4=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/frontend/modules/user/components/UserBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UserBadge",
    ()=>UserBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$store$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/frontend/store/hooks.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function UserBadge() {
    _s();
    const { isAuthenticated, displayName, email } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$store$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"])({
        "UserBadge.useAppSelector": (s)=>s.auth
    }["UserBadge.useAppSelector"]);
    if (!isAuthenticated) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-sm text-zinc-600 dark:text-zinc-400",
            children: [
                "Not signed in — use ",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "font-medium",
                    children: "Log in"
                }, void 0, false, {
                    fileName: "[project]/src/frontend/modules/user/components/UserBadge.tsx",
                    lineNumber: 11,
                    columnNumber: 29
                }, this),
                " for a static session."
            ]
        }, void 0, true, {
            fileName: "[project]/src/frontend/modules/user/components/UserBadge.tsx",
            lineNumber: 10,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "font-medium text-zinc-900 dark:text-zinc-50",
                children: displayName
            }, void 0, false, {
                fileName: "[project]/src/frontend/modules/user/components/UserBadge.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-zinc-600 dark:text-zinc-400",
                children: email
            }, void 0, false, {
                fileName: "[project]/src/frontend/modules/user/components/UserBadge.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/frontend/modules/user/components/UserBadge.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
_s(UserBadge, "6qxn0cfceM0mWwH2Ni1k9hJs49k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$frontend$2f$store$2f$hooks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppSelector"]
    ];
});
_c = UserBadge;
var _c;
__turbopack_context__.k.register(_c, "UserBadge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_frontend_0wg_7uk._.js.map