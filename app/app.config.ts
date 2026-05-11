export default defineAppConfig({
    ui: {
        colors: {
            primary: "green",
            neutral: "zinc",
        },
        dashboardGroup: {
            base: 'fixed inset-0 flex overflow-hidden'
        },
        container: {
            base: 'w-full mx-auto px-4 sm:px-6 lg:px-5'
        },
        dashboardPanel: {
            slots: {
                body: "flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-2 sm:p-0",
                handle: "",
            },
            variants: {
                size: {
                    true: {
                        root: "w-full lg:w-(--width)",
                    },
                    false: {
                        root: "flex-1",
                    },
                },
            },
        },
    }
});
