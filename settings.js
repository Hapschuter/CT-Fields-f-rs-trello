var t = window.TrelloPowerUp.iframe();


// ======================================================
// DOM
// ======================================================

var fieldsContainer =
    document.getElementById('fieldsContainer');

var addFieldButton =
    document.getElementById('addFieldButton');

var defaultsButton =
    document.getElementById('defaultsButton');

var saveButton =
    document.getElementById('saveButton');

var status =
    document.getElementById('status');

var sizeInfo =
    document.getElementById('sizeInfo');


// ======================================================
// STATE
// ======================================================

var schema =
    ctGetDefaultSchema();

var boardSharedData = {};

var counter = 0;

var isDirty = false;

var openState = {};

var saveButtonTimer = null;


// ======================================================
// HILFSFUNKTIONEN
// ======================================================

function createId(prefix) {

    counter++;

    return (
        prefix +
        '-' +
        Date.now().toString(36) +
        '-' +
        counter
    );
}


function getTypeLabel(type) {

    if (type === 'select') {
        return 'Auswahl';
    }

    if (type === 'date') {
        return 'Datum';
    }

    return 'Text';
}


function getColorLabel(value) {

    var match =
        CT_COLOR_OPTIONS.find(function (item) {
            return item.value === value;
        });

    return match
        ? match.label
        : value;
}


function getCssColor(value) {

    var colors = {

        'light-gray': '#555960',
        'red': '#8f2924',
        'blue': '#1f4f91',
        'green': '#236c4b',
        'purple': '#65479a',
        'orange': '#a95412',
        'yellow': '#856400',
        'sky': '#238297',
        'lime': '#596b2c'

    };

    return colors[value] || colors['light-gray'];
}


// ======================================================
// STATUS
// ======================================================

function setStatus(message, type) {

    status.textContent = message;

    status.className =
        'status-pill status-' +
        (type || 'neutral');
}


function setSaveButtonState(state) {

    clearTimeout(saveButtonTimer);

    saveButton.disabled = false;
    saveButton.classList.add('mod-primary');


    if (state === 'saving') {

        saveButton.textContent =
            'Speichere...';

        saveButton.disabled = true;

        return;
    }


    if (state === 'saved') {

        saveButton.textContent =
            'Gespeichert ✓';

        saveButtonTimer =
            setTimeout(function () {

                setSaveButtonState(
                    isDirty
                        ? 'dirty'
                        : 'default'
                );

            }, 1800);

        return;
    }


    if (state === 'dirty') {

        saveButton.textContent =
            'Änderungen speichern';

        return;
    }


    saveButton.textContent =
        'Einstellungen speichern';
}


function markDirty(message) {

    isDirty = true;

    setSaveButtonState('dirty');

    setStatus(
        message || 'Ungespeicherte Änderungen',
        'warning'
    );

    updateSizeInfo();
}


// ======================================================
// SCHEMA RECOVERY
// ======================================================

function rawSchemaHasFields(raw) {

    if (!raw) {
        return false;
    }


    // Kompaktes Schema
    if (
        raw.v === 2 &&
        Array.isArray(raw.f) &&
        raw.f.length > 0
    ) {
        return true;
    }


    // Unkomprimiertes Schema
    if (
        raw.version === 2 &&
        Array.isArray(raw.fields) &&
        raw.fields.length > 0
    ) {
        return true;
    }


    return false;
}


// Alte ctConfig-Struktur aus unserer früheren Version
// in das neue dynamische Schema umwandeln.

function migrateLegacyConfig(legacy) {

    if (
        !legacy ||
        typeof legacy !== 'object'
    ) {
        return null;
    }


    var hasSomething =
        Array.isArray(legacy.units) ||
        Array.isArray(legacy.ranks) ||
        Array.isArray(legacy.positions) ||
        Array.isArray(legacy.adjutants);


    if (!hasSomething) {
        return null;
    }


    function cloneOptions(items) {

        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item) {

            return {

                id:
                    item.id ||
                    createId('legacy-option'),

                label:
                    item.label ||
                    item.name ||
                    item.id ||
                    'Unbekannt',

                color:
                    item.color ||
                    'light-gray'

            };

        });
    }


    var fixed =
        legacy.fixedColors || {};


    return {

        version: 2,

        fields: [

            {
                id: 'unit',
                label: 'Untereinheit',
                type: 'select',
                color: 'light-gray',
                options:
                    cloneOptions(
                        legacy.units
                    )
            },

            {
                id: 'rank',
                label: 'Rang',
                type: 'select',
                color: 'light-gray',
                options:
                    cloneOptions(
                        legacy.ranks
                    )
            },

            {
                id: 'position',
                label: 'Position',
                type: 'select',
                color: 'light-gray',
                options:
                    cloneOptions(
                        legacy.positions
                    )
            },

            {
                id: 'adjutant',
                label: 'Adjutant',
                type: 'select',
                color: 'light-gray',
                options:
                    cloneOptions(
                        legacy.adjutants
                    )
            },

            {
                id: 'promotion',
                label: 'Letzte Beförderung',
                type: 'date',
                color:
                    fixed.promotion ||
                    'red',
                options: []
            },

            {
                id: 'testUntil',
                label: 'Testzeit',
                type: 'date',
                color:
                    fixed.testUntil ||
                    'yellow',
                options: []
            },

            {
                id: 'ctId',
                label: 'ID',
                type: 'text',
                color:
                    fixed.ctId ||
                    'light-gray',
                options: []
            }

        ]

    };
}


// ======================================================
// COLOR SELECT
// ======================================================

function createColorSelect(
    currentColor,
    callback
) {

    var select =
        document.createElement('select');


    CT_COLOR_OPTIONS.forEach(
        function (color) {

            var option =
                document.createElement('option');

            option.value =
                color.value;

            option.textContent =
                color.label;


            if (
                color.value ===
                currentColor
            ) {

                option.selected =
                    true;
            }


            select.appendChild(option);

        }
    );


    select.addEventListener(
        'change',
        function () {

            callback(select.value);

            markDirty();

        }
    );


    return select;
}


// ======================================================
// MOVE
// ======================================================

function moveItem(
    array,
    index,
    direction
) {

    var newIndex =
        index + direction;


    if (
        newIndex < 0 ||
        newIndex >= array.length
    ) {

        return false;
    }


    var old =
        array[index];


    array[index] =
        array[newIndex];


    array[newIndex] =
        old;


    return true;
}


// ======================================================
// GROUP
// ======================================================

function createGroup(labelText) {

    var wrapper =
        document.createElement('div');

    wrapper.className =
        'group';


    var label =
        document.createElement('label');

    label.textContent =
        labelText;


    wrapper.appendChild(label);


    return wrapper;
}


// ======================================================
// AUSWAHLOPTIONEN
// ======================================================

function renderOptions(
    field,
    container
) {

    var panel =
        document.createElement('div');

    panel.className =
        'options-panel';


    var head =
        document.createElement('div');

    head.className =
        'options-head';


    var text =
        document.createElement('div');


    var headline =
        document.createElement('h3');

    headline.textContent =
        'Auswahloptionen';


    var description =
        document.createElement('p');

    description.textContent =
        'Diese Optionen gehören zu "' +
        field.label +
        '".';


    text.appendChild(headline);
    text.appendChild(description);


    var add =
        document.createElement('button');

    add.type =
        'button';

    add.textContent =
        '+ Auswahloption';


    add.addEventListener(
        'click',
        function () {

            field.options.push({

                id:
                    createId('option'),

                label:
                    'Neue Option',

                color:
                    'light-gray'

            });


            openState[field.id] =
                true;


            render();


            markDirty(
                'Auswahloption hinzugefügt'
            );

        }
    );


    head.appendChild(text);
    head.appendChild(add);

    panel.appendChild(head);


    var list =
        document.createElement('div');

    list.className =
        'option-list';


    field.options.forEach(
        function (
            option,
            index
        ) {

            var row =
                document.createElement('div');

            row.className =
                'option-row';


            var name =
                document.createElement('input');

            name.type =
                'text';

            name.value =
                option.label;


            name.addEventListener(
                'input',
                function () {

                    option.label =
                        name.value;

                    markDirty();

                }
            );


            var color =
                createColorSelect(

                    option.color,

                    function (value) {

                        option.color =
                            value;

                    }

                );


            var actions =
                document.createElement('div');

            actions.className =
                'actions';


            var up =
                document.createElement('button');

            up.type =
                'button';

            up.textContent =
                '↑';


            up.addEventListener(
                'click',
                function () {

                    if (
                        moveItem(
                            field.options,
                            index,
                            -1
                        )
                    ) {

                        openState[field.id] =
                            true;

                        render();

                        markDirty(
                            'Auswahloption verschoben'
                        );
                    }

                }
            );


            var down =
                document.createElement('button');

            down.type =
                'button';

            down.textContent =
                '↓';


            down.addEventListener(
                'click',
                function () {

                    if (
                        moveItem(
                            field.options,
                            index,
                            1
                        )
                    ) {

                        openState[field.id] =
                            true;

                        render();

                        markDirty(
                            'Auswahloption verschoben'
                        );
                    }

                }
            );


            var remove =
                document.createElement('button');

            remove.type =
                'button';

            remove.textContent =
                '✕';


            remove.addEventListener(
                'click',
                function () {

                    field.options.splice(
                        index,
                        1
                    );


                    openState[field.id] =
                        true;


                    render();


                    markDirty(
                        'Auswahloption entfernt'
                    );

                }
            );


            actions.appendChild(up);
            actions.appendChild(down);
            actions.appendChild(remove);


            row.appendChild(name);
            row.appendChild(color);
            row.appendChild(actions);


            list.appendChild(row);

        }
    );


    panel.appendChild(list);

    container.appendChild(panel);
}


// ======================================================
// KATEGORIE
// ======================================================

function renderField(
    field,
    index
) {

    var details =
        document.createElement('details');

    details.className =
        'field-card';


    details.open =
        openState[field.id] !== undefined
            ? openState[field.id]
            : false;


    details.addEventListener(
        'toggle',
        function () {

            openState[field.id] =
                details.open;

        }
    );


    // SUMMARY

    var summary =
        document.createElement('summary');

    summary.className =
        'field-summary';


    var left =
        document.createElement('div');

    left.className =
        'summary-left';


    var title =
        document.createElement('div');

    title.className =
        'summary-title';

    title.textContent =
        field.label;


    var meta =
        document.createElement('div');

    meta.className =
        'summary-meta';


    var typeBadge =
        document.createElement('span');

    typeBadge.className =
        'meta-pill';

    typeBadge.textContent =
        getTypeLabel(
            field.type
        );


    meta.appendChild(typeBadge);


    if (
        field.type ===
        'select'
    ) {

        var count =
            document.createElement('span');

        count.className =
            'meta-pill';

        count.textContent =
            field.options.length +
            ' Optionen';

        meta.appendChild(count);
    }


    left.appendChild(title);
    left.appendChild(meta);


    var right =
        document.createElement('div');

    right.className =
        'summary-right';


    var colorDot =
        document.createElement('span');

    colorDot.className =
        'summary-color';

    colorDot.style.backgroundColor =
        getCssColor(
            field.color
        );


    var arrow =
        document.createElement('span');

    arrow.className =
        'summary-chevron';

    arrow.textContent =
        '›';


    right.appendChild(colorDot);
    right.appendChild(arrow);


    summary.appendChild(left);
    summary.appendChild(right);


    details.appendChild(summary);


    // BODY

    var body =
        document.createElement('div');

    body.className =
        'field-body';


    var grid =
        document.createElement('div');

    grid.className =
        'field-grid';


    // NAME

    var nameGroup =
        createGroup('Bezeichnung');


    var name =
        document.createElement('input');

    name.type =
        'text';

    name.value =
        field.label;


    name.addEventListener(
        'input',
        function () {

            field.label =
                name.value;

            title.textContent =
                name.value ||
                'Neue Kategorie';

            markDirty();

        }
    );


    nameGroup.appendChild(name);

    grid.appendChild(nameGroup);


    // TYP

    var typeGroup =
        createGroup('Feldtyp');


    var type =
        document.createElement('select');


    [
        ['select', 'Auswahl'],
        ['text', 'Text'],
        ['date', 'Datum']

    ].forEach(
        function (entry) {

            var option =
                document.createElement(
                    'option'
                );

            option.value =
                entry[0];

            option.textContent =
                entry[1];


            if (
                entry[0] ===
                field.type
            ) {

                option.selected =
                    true;
            }


            type.appendChild(option);

        }
    );


    type.addEventListener(
        'change',
        function () {

            field.type =
                type.value;


            if (
                !Array.isArray(
                    field.options
                )
            ) {

                field.options =
                    [];
            }


            openState[field.id] =
                true;


            render();


            markDirty(
                'Feldtyp geändert'
            );

        }
    );


    typeGroup.appendChild(type);

    grid.appendChild(typeGroup);


    // FARBE

    var colorGroup =
        createGroup(
            field.type === 'select'
                ? 'Fallbackfarbe'
                : 'Feldfarbe'
        );


    var color =
        createColorSelect(

            field.color,

            function (value) {

                field.color =
                    value;

                colorDot.style.backgroundColor =
                    getCssColor(value);

            }

        );


    colorGroup.appendChild(color);

    grid.appendChild(colorGroup);


    body.appendChild(grid);


    // ACTIONS

    var fieldActions =
        document.createElement('div');

    fieldActions.className =
        'field-actions';


    var up =
        document.createElement('button');

    up.type =
        'button';

    up.textContent =
        '↑ Nach oben';


    up.addEventListener(
        'click',
        function () {

            if (
                moveItem(
                    schema.fields,
                    index,
                    -1
                )
            ) {

                openState[field.id] =
                    true;

                render();

                markDirty(
                    'Kategorie verschoben'
                );
            }

        }
    );


    var down =
        document.createElement('button');

    down.type =
        'button';

    down.textContent =
        '↓ Nach unten';


    down.addEventListener(
        'click',
        function () {

            if (
                moveItem(
                    schema.fields,
                    index,
                    1
                )
            ) {

                openState[field.id] =
                    true;

                render();

                markDirty(
                    'Kategorie verschoben'
                );
            }

        }
    );


    var remove =
        document.createElement('button');

    remove.type =
        'button';

    remove.textContent =
        'Kategorie entfernen';


    remove.addEventListener(
        'click',
        function () {

            var confirmed =
                window.confirm(
                    'Kategorie "' +
                    field.label +
                    '" wirklich entfernen?\n\n' +
                    'Die Werte auf den Karten werden nicht sofort gelöscht.'
                );


            if (!confirmed) {
                return;
            }


            schema.fields.splice(
                index,
                1
            );


            delete openState[
                field.id
            ];


            render();


            markDirty(
                'Kategorie entfernt'
            );

        }
    );


    fieldActions.appendChild(up);
    fieldActions.appendChild(down);
    fieldActions.appendChild(remove);


    body.appendChild(
        fieldActions
    );


    if (
        field.type ===
        'select'
    ) {

        renderOptions(
            field,
            body
        );
    }


    details.appendChild(body);

    fieldsContainer.appendChild(
        details
    );
}


// ======================================================
// RENDER
// ======================================================

function render() {

    fieldsContainer.innerHTML =
        '';


    schema.fields.forEach(
        renderField
    );


    updateSizeInfo();
}


// ======================================================
// VALIDIERUNG
// ======================================================

function validateSchema() {

    if (
        !schema.fields ||
        schema.fields.length === 0
    ) {

        return {
            valid: false,
            message:
                'Es muss mindestens eine Kategorie vorhanden sein.'
        };
    }


    var fields = {};


    for (
        var i = 0;
        i < schema.fields.length;
        i++
    ) {

        var field =
            schema.fields[i];


        field.label =
            field.label.trim();


        if (!field.label) {

            return {
                valid: false,
                message:
                    'Eine Kategorie hat keinen Namen.'
            };
        }


        var fieldKey =
            field.label.toLowerCase();


        if (fields[fieldKey]) {

            return {
                valid: false,
                message:
                    'Doppelte Kategorie: ' +
                    field.label
            };
        }


        fields[fieldKey] =
            true;


        if (
            field.type ===
            'select'
        ) {

            var options = {};


            for (
                var x = 0;
                x < field.options.length;
                x++
            ) {

                var option =
                    field.options[x];


                option.label =
                    option.label.trim();


                if (!option.label) {

                    return {
                        valid: false,
                        message:
                            'Leere Auswahloption in "' +
                            field.label +
                            '".'
                    };
                }


                var optionKey =
                    option.label.toLowerCase();


                if (
                    options[
                        optionKey
                    ]
                ) {

                    return {
                        valid: false,
                        message:
                            'Doppelte Option "' +
                            option.label +
                            '" in "' +
                            field.label +
                            '".'
                    };
                }


                options[optionKey] =
                    true;
            }
        }
    }


    return {
        valid: true
    };
}


// ======================================================
// STORAGE SIZE
// ======================================================

function calculateProjectedSize() {

    var encoded =
        ctEncodeSchema(schema);


    var projected =
        Object.assign(
            {},
            boardSharedData || {}
        );


    /*
     * Legacy-Konfiguration wird beim
     * Speichern entfernt.
     */
    delete projected.ctConfig;


    projected.ctSchema =
        encoded;


    return JSON.stringify(
        projected
    ).length;
}


function updateSizeInfo() {

    var size =
        calculateProjectedSize();


    sizeInfo.textContent =
        'Konfigurationsgröße: ' +
        size +
        ' / 4096 Zeichen';


    sizeInfo.className =
        'size-info';


    if (size > 3500) {

        sizeInfo.classList.add(
            'warning-size'
        );
    }


    if (size > 3900) {

        sizeInfo.classList.remove(
            'warning-size'
        );

        sizeInfo.classList.add(
            'error-size'
        );
    }
}


// ======================================================
// NEUE KATEGORIE
// ======================================================

addFieldButton.addEventListener(
    'click',
    function () {

        var field = {

            id:
                createId('field'),

            label:
                'Neue Kategorie',

            type:
                'text',

            color:
                'light-gray',

            options:
                []

        };


        schema.fields.push(
            field
        );


        openState[field.id] =
            true;


        render();


        markDirty(
            'Kategorie hinzugefügt'
        );

    }
);


// ======================================================
// DEFAULTS
// ======================================================

defaultsButton.addEventListener(
    'click',
    function () {

        var confirmed =
            window.confirm(
                'Standardwerte laden?\n\n' +
                'Deine aktuellen Änderungen werden ersetzt. ' +
                'Gespeichert wird erst nach Klick auf "Einstellungen speichern".'
            );


        if (!confirmed) {
            return;
        }


        schema =
            ctGetDefaultSchema();


        openState =
            {};


        render();


        markDirty(
            'Standardwerte geladen – noch nicht gespeichert'
        );

    }
);


// ======================================================
// TIMEOUT
// ======================================================

function withTimeout(
    promise,
    milliseconds
) {

    return Promise.race([

        promise,

        new Promise(
            function (
                resolve,
                reject
            ) {

                setTimeout(
                    function () {

                        reject(
                            new Error(
                                'timeout'
                            )
                        );

                    },
                    milliseconds
                );

            }
        )

    ]);
}


// ======================================================
// SPEICHERN
// ======================================================

saveButton.addEventListener(
    'click',
    function () {

        var context =
            t.getContext();


        if (
            !context.permissions ||
            context.permissions.board !== 'write'
        ) {

            setStatus(
                'Keine Schreibberechtigung.',
                'error'
            );

            return;
        }


        var validation =
            validateSchema();


        if (!validation.valid) {

            setStatus(
                validation.message,
                'error'
            );

            return;
        }


        var encoded =
            ctEncodeSchema(schema);


        var projectedSize =
            calculateProjectedSize();


        if (
            projectedSize > 4096
        ) {

            setStatus(
                'Konfiguration zu groß (' +
                projectedSize +
                ' / 4096 Zeichen).',
                'error'
            );

            return;
        }


        setSaveButtonState(
            'saving'
        );


        setStatus(
            'Speichere Einstellungen...',
            'info'
        );


        var removeLegacy;


        if (
            Object.prototype.hasOwnProperty.call(
                boardSharedData,
                'ctConfig'
            )
        ) {

            removeLegacy =
                t.remove(
                    'board',
                    'shared',
                    'ctConfig'
                );

        } else {

            removeLegacy =
                Promise.resolve();
        }


        var operation =
            removeLegacy

            .then(function () {

                return t.set(
                    'board',
                    'shared',
                    'ctSchema',
                    encoded
                );

            })

            .then(function () {

                return t.get(
                    'board',
                    'shared',
                    'ctSchema',
                    null
                );

            })

            .then(function (
                savedSchema
            ) {

                if (
                    JSON.stringify(
                        savedSchema
                    ) !==
                    JSON.stringify(
                        encoded
                    )
                ) {

                    throw new Error(
                        'verify-failed'
                    );
                }


                boardSharedData.ctSchema =
                    encoded;


                delete boardSharedData.ctConfig;


                isDirty =
                    false;


                setStatus(
                    'Einstellungen gespeichert ✓',
                    'success'
                );


                setSaveButtonState(
                    'saved'
                );


                updateSizeInfo();

            });


        withTimeout(
            operation,
            8000
        )

        .catch(function (error) {

            console.error(
                'CT Fields Save Error:',
                error
            );


            if (
                error.message ===
                'timeout'
            ) {

                setStatus(
                    'Speichern dauert zu lange. Bitte erneut versuchen.',
                    'error'
                );

            } else {

                setStatus(
                    'Fehler beim Speichern: ' +
                    (
                        error.message ||
                        'Unbekannter Fehler'
                    ),
                    'error'
                );

            }


            setSaveButtonState(
                'dirty'
            );

        });

    }
);


// ======================================================
// INITIAL LADEN + RECOVERY
// ======================================================

setStatus(
    'Lade Einstellungen...',
    'info'
);


t.get(
    'board',
    'shared'

).then(function (
    shared
) {

    boardSharedData =
        shared || {};


    // 1. Neues Schema vorhanden und nicht leer

    if (
        rawSchemaHasFields(
            boardSharedData.ctSchema
        )
    ) {

        schema =
            ctDecodeSchema(
                boardSharedData.ctSchema
            );


        render();


        setStatus(
            'Bereit',
            'neutral'
        );


        setSaveButtonState(
            'default'
        );


        return;
    }


    // 2. Neues Schema leer/kaputt:
    //    Versuch, alte ctConfig wiederherzustellen.

    var migrated =
        migrateLegacyConfig(
            boardSharedData.ctConfig
        );


    if (migrated) {

        schema =
            migrated;


        render();


        isDirty =
            true;


        setStatus(
            'Alte Konfiguration wiederhergestellt – bitte einmal speichern.',
            'warning'
        );


        setSaveButtonState(
            'dirty'
        );


        return;
    }


    // 3. Nichts Wiederherstellbares vorhanden:
    //    Defaults nur lokal laden.

    schema =
        ctGetDefaultSchema();


    render();


    isDirty =
        true;


    setStatus(
        'Leere Konfiguration erkannt – Standardwerte wurden geladen. Bitte prüfen und speichern.',
        'warning'
    );


    setSaveButtonState(
        'dirty'
    );

})

.catch(function (
    error
) {

    console.error(
        'CT Fields Load Error:',
        error
    );


    schema =
        ctGetDefaultSchema();


    render();


    setStatus(
        'Konfiguration konnte nicht geladen werden. Standardwerte werden angezeigt.',
        'error'
    );


    setSaveButtonState(
        'dirty'
    );

});
