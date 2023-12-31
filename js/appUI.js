let contentScrollPosition = 0;
var selectedCategory = null;
Init_UI();

function Init_UI() {
    renderDropDown();
    renderBookmarks();
    $('#createBookmark').on("click", async function () {
        saveContentScrollPosition();
        renderCreateBookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderBookmarks();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de favoris</h2>
                <hr>
                <p>
                    Petite application de gestion de favors à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Olivier Morin
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
async function renderBookmarks() {
    showWaitingGif();
    $("#actionTitle").text("Liste des favoris");
    $("#createBookmark").show();
    $("#abort").hide();
    let bookmarks = await Bookmarks_API.Get();
    eraseContent();
    if (bookmarks !== null) {
        bookmarks.forEach(bookmark => {
            $("#content").append(renderBookmark(bookmark));
        });
        restoreContentScrollPosition();
        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
        });
    } else {
        renderError("Service introuvable");
    }
}
function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateBookmarkForm() {
    renderBookmarkForm();
}
async function renderEditBookmarkForm(id) {
    showWaitingGif();
    let bookmark = await Bookmarks_API.Get(id);
    if (bookmark !== null)
        renderBookmarkForm(bookmark);
    else
        renderError("Favori introuvable!");
}
async function renderDeleteBookmarkForm(id) {
    showWaitingGif();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let bookmark = await Bookmarks_API.Get(id);
    eraseContent();
    if (bookmark !== null) {
        $("#content").append(`
        <div class="bookmarkdeleteForm">
            <h4>Effacer le favori suivant?</h4>
            <br>
            <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
                <div class="bookmarkContainer">
                    <div class="bookmarkLayout">
                        <a href="${bookmark.Url}" class="small favicon"
                            style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${bookmark.Url}');">
                        </a>
                        <span class="bookmarkTitle">${bookmark.Title}</span>
                        <span class="bookmarkCategory">${bookmark.Category}</span>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteBookmark').on("click", async function () {
            showWaitingGif();
            let result = await Bookmarks_API.Delete(bookmark.Id);
            if (result) {
                selectedCategory = null;
                renderDropDown();
                renderBookmarks();
            }
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderDropDown();
            renderBookmarks();
        });
    } else {
        renderError("Favori introuvable!");
    }
}
function newBookmark() {
    bookmark = {};
    bookmark.Id = 0;
    bookmark.Title = "";
    bookmark.Url = "";
    bookmark.Category = "";
    return bookmark;
}
function renderBookmarkForm(bookmark = null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = bookmark == null;
    if (create) bookmark = newBookmark();
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="bookmarkForm">
            <div id="bookmarkIcon">`+
        (bookmark.Url ?
            `<div class="big favicon"style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${bookmark.Url}');"></div>`
            : `<img src="bookmark.png" class="big" title="Gestionnaire de favoris"></img>`)
        + `
            </div>
            <input type="hidden" name="Id" value="${bookmark.Id}"/>
            <label for="Title" class="form-label">Titre</label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${bookmark.Title}"
            />
            <label for="Url" class="form-label">Url </label>
            <input
                class="form-control URL"
                name="Url"
                id="Url"
                placeholder="Url"
                required
                RequireMessage="Veuillez entrer un url" 
                InvalidMessage="Veuillez entrer un url valide"
                value="${bookmark.Url}" 
            />
            <label for="Category" class="form-label">Catégorie</label>
            <input 
                class="form-control Alpha"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie" 
                InvalidMessage="Veuillez entrer une catégorie valide"
                value="${bookmark.Category}"
            />
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initFormValidation();
    $("#Url").on("change", function () {
        $("#bookmarkIcon").empty();
        if ($("#Url").val()) {
            $("#bookmarkIcon").append(`
                <div class="big favicon"style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${$(this).val()}');"></div>
            `);
        }
        else {
            $("#bookmarkIcon").append(`<img src="bookmark.png" class="big" title="Gestionnaire de favoris"></img>`);
        }
    });
    $('#bookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let bookmark = getFormData($("#bookmarkForm"));
        bookmark.Id = parseInt(bookmark.Id);
        showWaitingGif();
        let result = await Bookmarks_API.Save(bookmark, create);
        if (result) {
            selectedCategory = null;
            renderDropDown();
            renderBookmarks();
        }
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderDropDown();
        renderBookmarks();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderBookmark(bookmark) {
    if (bookmark.Category == selectedCategory || selectedCategory == null) {
        return $(`
        <div class="bookmarkRow" bookmark_id="${bookmark.Id}">
            <div class="bookmarkContainer noselect">
                <div class="bookmarkLayout">
                    <a href="${bookmark.Url}" target="_blank" class="small favicon"
                        style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${bookmark.Url}');">
                    </a>
                    <span class="bookmarkTitle">${bookmark.Title}</span>
                    <span class="bookmarkCategory">${bookmark.Category}</span>
                </div>
                <div class="bookmarkCommandPanel">
                    <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Title}"></span>
                    <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Title}"></span>
                </div>
            </div>
        </div>
        `);
    }
    return null;
}

async function renderDropDown() {
    $(".dropdown").remove();
    $("#header").append(`
    <div class="dropdown ms-auto">
        <div data-bs-toggle="dropdown" aria-expanded="false">
            <i class="cmdIcon fa fa-ellipsis-vertical"></i>
        </div>
        <div class="dropdown-menu noselect" id="DDMenu" style="position: absolute; inset: 0px auto auto 0px; margin: 0px; transform: translate(-193px, 42px);" data-popper-placement="bottom-end">
            <div class="dropdown-item menuItemLayout" id="allCatCmd">
                <i class="menuIcon fa `+ (selectedCategory != null ? "fa-fw" : "fa-check") + ` mx-2"></i> Toutes les catégories
            </div>
            <div class="dropdown-divider"></div>
        </div>
    </div>`);

    let bookmarks = await Bookmarks_API.Get();
    const categories = [];

    for (bookmark of bookmarks) {
        if (!categories.includes(bookmark.Category)) {
            categories.push(bookmark.Category);
        }
    }

    categories.sort();

    for (category of categories) {
        if (category == selectedCategory) {
            $("#DDMenu").append(`
            <div class="dropdown-item menuItemLayout category">
                <i class="menuIcon fa fa-check mx-2"></i>${category}
            </div>
            `);
        } else {
            $("#DDMenu").append(`
            <div class="dropdown-item menuItemLayout category">
                <i class="menuIcon fa fa-fw mx-2"></i>${category}
            </div>
            `);
        }
    }

    $("#DDMenu").append(`
        <div class="dropdown-divider"></div>
        <div class="dropdown-item" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
    `);

    $(".category").on("click", function () {
        selectedCategory = $(this).text().trim();
        renderDropDown();
        renderBookmarks();
    });

    $("#allCatCmd").on("click", function () {
        selectedCategory = null;
        renderDropDown();
        renderBookmarks();
    });

    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}