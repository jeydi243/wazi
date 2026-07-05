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
        modal: {
            slots: {
                header: "bg-[url(/assets/img/pattern.jpg)] bg-cover bg-center bg-no-repeat dark:bg-none",
                content:"bg-(--ui-bg) dark:bg-(--ui-bg)"
            }
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
