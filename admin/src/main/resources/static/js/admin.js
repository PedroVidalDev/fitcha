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

    document.querySelectorAll("[data-machine-tracking-type]").forEach((select) => {
        const form = select.closest("form");
        const field = form?.querySelector("[data-machine-requires-weight]");
        const checkbox = field?.querySelector('input[type="checkbox"]');

        if (!checkbox) {
            return;
        }

        const syncRequiresWeight = () => {
            const recordsDuration = select.value === "duration";
            checkbox.disabled = recordsDuration;
            if (recordsDuration) {
                checkbox.checked = false;
            }
            field.classList.toggle("is-disabled", recordsDuration);
        };

        select.addEventListener("change", syncRequiresWeight);
        syncRequiresWeight();
    });

    document.querySelectorAll("[data-machine-photo-input]").forEach((input) => {
        input.addEventListener("change", () => {
            const image = input.files?.[0];
            const field = input.closest(".machine-photo-field");
            if (!image || !field) {
                return;
            }

            const reader = new FileReader();
            reader.addEventListener("load", () => {
                let preview = field.querySelector("[data-machine-photo-preview]");
                const placeholder = field.querySelector("[data-machine-photo-placeholder]");

                if (!preview) {
                    preview = document.createElement("img");
                    preview.className = "machine-photo-preview";
                    preview.alt = "Prévia da imagem selecionada";
                    preview.dataset.machinePhotoPreview = "";
                    field.insertBefore(preview, field.firstChild);
                }

                preview.src = reader.result;
                placeholder?.remove();
            });
            reader.readAsDataURL(image);
        });
    });
});
