module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/config/app.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "APP_NAME",
    ()=>APP_NAME,
    "APP_VERSION",
    ()=>APP_VERSION
]);
const APP_NAME = "FitGen AI";
const APP_VERSION = "0.1.0";
}),
"[project]/src/backend/services/welcome.service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getWelcomeMessage",
    ()=>getWelcomeMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$app$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/app.ts [app-route] (ecmascript)");
;
function getWelcomeMessage() {
    return {
        message: `Welcome to ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$app$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_NAME"]}! Your fitness journey starts here.`,
        app: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$app$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_NAME"],
        version: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$app$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["APP_VERSION"],
        timestamp: new Date().toISOString(),
        status: "ok"
    };
}
}),
"[project]/src/backend/controllers/welcome.controller.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "welcomeController",
    ()=>welcomeController
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$services$2f$welcome$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/backend/services/welcome.service.ts [app-route] (ecmascript)");
;
;
function welcomeController() {
    const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$services$2f$welcome$2e$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getWelcomeMessage"])();
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data, {
        status: 200
    });
}
}),
"[project]/src/app/api/welcome/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$controllers$2f$welcome$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/backend/controllers/welcome.controller.ts [app-route] (ecmascript)");
;
function GET() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$backend$2f$controllers$2f$welcome$2e$controller$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["welcomeController"])();
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0n-qkeq._.js.map