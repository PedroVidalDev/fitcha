document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const openButton = document.querySelector("[data-sidebar-open]");
    const closeButton = document.querySelector("[data-sidebar-close]");

    openButton?.addEventListener("click", () => {
        body.classList.add("sidebar-open");
    });

    closeButton?.addEventListener("click", () => {
        body.classList.remove("sidebar-open");
    });

    document.querySelectorAll("[data-table-search]").forEach((input) => {
        const table = document.getElementById(input.dataset.tableSearch);
        if (!table) {
            return;
        }

        input.addEventListener("input", () => {
            const query = input.value.trim().toLocaleLowerCase("pt-BR");

            table.querySelectorAll("[data-search-row]").forEach((row) => {
                const value = (row.dataset.searchValue || "").toLocaleLowerCase("pt-BR");
                row.classList.toggle("is-filtered", query.length > 0 && !value.includes(query));
            });
        });
    });
});
