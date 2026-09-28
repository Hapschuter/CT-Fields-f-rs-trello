var t =
    window.TrelloPowerUp.iframe();


// ======================================================
// ELEMENTE
// ======================================================

var fieldsGrid =
    document.getElementById(
        'fieldsGrid'
    );


var plausibilityWarning =
    document.getElementById(
        'plausibilityWarning'
    );


var status =
    document.getElementById(
        'status'
    );


// ======================================================
// STATE
// ======================================================

var schema = null;

var storedValues = {};

var currentListName = '';

var canWrite = false;

var loaded = false;

var statusTimer = null;


// ======================================================
// KARTENDATEN
// ======================================================

function extractValues(data) {

    if (
        data &&
        data.v === 2 &&
        data.values
    ) {

        return Object.assign(
            {},
            data.values
        );

    }


    return Object.assign(
        {},
        data || {}
    );
}


// ======================================================
// FIELD FINDEN
// ======================================================

function getField(fieldId) {

    if (
        !schema ||
        !Array.isArray(
            schema.fields
        )
    ) {

        return null;

    }


    return schema.fields.find(
        function (field) {

            return (
                field.id ===
                fieldId
            );

        }
    ) || null;
}


// ======================================================
// LISTENNAME NORMALISIEREN
// ======================================================

function normalizeListName(name) {

    return String(name || '')

        .replace(
            /↓/g,
            ''
        )

        .replace(
            /\s+/g,
            ' '
        )

        .trim()

        .toLowerCase();
}


// ======================================================
// PLAUSIBILITÄTSCHECK
// ======================================================

function checkPlausibility() {

    var normalizedList =
        normalizeListName(
            currentListName
        );


    // ==================================================
    // LISTE -> RANG
    // ==================================================

    /*
     * Prüfung ausschließlich in diesen Spalten.
     *
     * Interessenten = Private First Class.
     */

    var listRules = {

        'interessenten':
            'private-first-class',

        'lance corporal':
            'lance-corporal',

        'corporal':
            'corporal',

        'sergeant':
            'sergeant',

        'staff sergeant':
            'staff-sergeant',

        'sergeant major':
            'sergeant-major',

        'lieutenant':
            'lieutenant',

        'first lieutenant':
            'first-lieutenant',

        'captain':
            'captain',

        'major':
            'major',

        'commander':
            'commander'

    };


    /*
     * Karte außerhalb der relevanten Spalten:
     *
     * keine Plausibilitätswarnung.
     */

    if (!listRules[normalizedList]) {

        plausibilityWarning.style.display =
            'none';

        return;

    }


    // ==================================================
    // RANG -> POSITION
    // ==================================================

    /*
     * PFC steht bewusst nicht drin.
     *
     * Private First Class hat
     * keine Positionsebene.
     */

    var positionRules = {

        'lance-corporal':
            'mannschaft',

        'corporal':
            'mannschaft',

        'sergeant':
            'unteroffizierebene',

        'staff-sergeant':
            'unteroffizierebene',

        'sergeant-major':
            'unteroffizierebene',

        'lieutenant':
            'fuehrungsebene',

        'first-lieutenant':
            'fuehrungsebene',

        'captain':
            'hohe-fuehrungsebene',

        'major':
            'hohe-fuehrungsebene',

        'commander':
            'hohe-fuehrungsebene'

    };


    var rankField =
        getField(
            'rank'
        );


    var positionField =
        getField(
            'position'
        );


    if (!rankField) {

        plausibilityWarning.style.display =
            'none';

        return;

    }


    var rank =
        ctNormalizeValue(
            rankField,
            storedValues.rank || ''
        );


    /*
     * Fehlender Rang ist kein
     * Plausibilitätsfehler.
     */

    if (!rank) {

        plausibilityWarning.style.display =
            'none';

        return;

    }


    /*
     * Nur bekannte Ränge prüfen.
     *
     * Custom / High General etc.
     * werden ignoriert.
     */

    var isKnownRank =
        rank === 'private-first-class' ||
        !!positionRules[rank];


    if (!isKnownRank) {

        plausibilityWarning.style.display =
            'none';

        return;

    }


    // ==================================================
    // 1. LISTE <-> RANG
    // ==================================================

    if (
        rank !==
        listRules[normalizedList]
    ) {

        plausibilityWarning.style.display =
            'block';

        return;

    }


    // ==================================================
    // 2. RANG <-> POSITION
    // ==================================================

    /*
     * PFC wird hier bewusst übersprungen.
     */

    if (
        positionRules[rank] &&
        positionField
    ) {

        var position =
            ctNormalizeValue(
                positionField,
                storedValues.position || ''
            );


        if (
            position !==
            positionRules[rank]
        ) {

            plausibilityWarning.style.display =
                'block';

            return;

        }

    }


    plausibilityWarning.style.display =
        'none';
}


// ======================================================
// FARBE SETZEN
// ======================================================

function setControlColor(
    control,
    color
) {

    var colors = [

        'light-gray',
        'red',
        'blue',
        'green',
        'purple',
        'orange',
        'yellow',
        'sky',
        'lime'

    ];


    colors.forEach(
        function (item) {

            control.classList.remove(
                'color-' + item
            );

        }
    );


    control.classList.add(
        'color-' +
        (
            color ||
            'light-gray'
        )
    );
}


// ======================================================
// STATUS
// ======================================================

function setStatus(
    text,
    resetAfter
) {

    clearTimeout(
        statusTimer
    );


    status.textContent =
        text;


    if (resetAfter) {

        statusTimer =
            setTimeout(
                function () {

                    status.textContent =
                        canWrite
                            ? 'Änderungen werden automatisch gespeichert.'
                            : 'Nur-Lese-Ansicht';

                },
                resetAfter
            );

    }
}


// ======================================================
// SPEICHERN
// ======================================================

function saveData() {

    if (
        !loaded ||
        !canWrite
    ) {
        return;
    }


    checkPlausibility();


    setStatus(
        'Speichere...'
    );


    return t.set(

        'card',

        'shared',

        'characterData',

        {

            v: 2,

            values:
                storedValues

        }

    ).then(function () {

        setStatus(
            'Gespeichert ✓',
            1200
        );

    }).catch(function (error) {

        console.error(
            'CT Fields Save Error:',
            error
        );


        setStatus(
            'Fehler beim Speichern',
            2500
        );

    });
}


// ======================================================
// SELECT
// ======================================================

function createSelect(
    field,
    currentValue
) {

    var select =
        document.createElement(
            'select'
        );


    var empty =
        document.createElement(
            'option'
        );


    empty.value =
        '';


    empty.textContent =
        '-- Keine Auswahl --';


    select.appendChild(
        empty
    );


    (
        field.options ||
        []
    ).forEach(
        function (option) {

            var element =
                document.createElement(
                    'option'
                );


            element.value =
                option.id;


            element.textContent =
                option.label;


            select.appendChild(
                element
            );

        }
    );


    var normalized =
        ctNormalizeValue(
            field,
            currentValue
        );


    /*
     * Gespeicherte Altwerte weiterhin anzeigen,
     * falls eine Option später entfernt wurde.
     */

    if (
        normalized &&
        !(
            field.options ||
            []
        ).some(
            function (option) {

                return (
                    option.id ===
                    normalized
                );

            }
        )
    ) {

        var legacy =
            document.createElement(
                'option'
            );


        legacy.value =
            normalized;


        legacy.textContent =
            normalized +
            ' (Altwert)';


        select.appendChild(
            legacy
        );

    }


    select.value =
        normalized || '';


    setControlColor(

        select,

        select.value

            ? ctGetValueColor(
                field,
                select.value
            )

            : 'light-gray'

    );


    select.addEventListener(
        'change',
        function () {

            storedValues[
                field.id
            ] =
                select.value;


            setControlColor(

                select,

                select.value

                    ? ctGetValueColor(
                        field,
                        select.value
                    )

                    : 'light-gray'

            );


            checkPlausibility();

            saveData();

        }
    );


    return select;
}


// ======================================================
// TEXT / DATUM
// ======================================================

function createInput(
    field,
    currentValue
) {

    var input =
        document.createElement(
            'input'
        );


    input.type =
        field.type === 'date'
            ? 'date'
            : 'text';


    input.value =
        currentValue || '';


    setControlColor(

        input,

        input.value
            ? field.color
            : 'light-gray'

    );


    input.addEventListener(
        'input',
        function () {

            setControlColor(

                input,

                input.value
                    ? field.color
                    : 'light-gray'

            );

        }
    );


    input.addEventListener(
        'change',
        function () {

            storedValues[
                field.id
            ] =
                input.value.trim();


            saveData();

        }
    );


    if (
        field.type ===
        'text'
    ) {

        input.addEventListener(
            'keydown',
            function (event) {

                if (
                    event.key ===
                    'Enter'
                ) {

                    event.preventDefault();

                    input.blur();

                }

            }
        );

    }


    return input;
}


// ======================================================
// FIELD RENDERN
// ======================================================

function renderField(field) {

    var wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'field';


    var label =
        document.createElement(
            'label'
        );


    label.textContent =
        field.label;


    label.title =
        field.label;


    var currentValue =
        storedValues[
            field.id
        ] || '';


    var control;


    if (
        field.type ===
        'select'
    ) {

        control =
            createSelect(
                field,
                currentValue
            );

    } else {

        control =
            createInput(
                field,
                currentValue
            );

    }


    control.disabled =
        !canWrite;


    wrapper.appendChild(
        label
    );


    wrapper.appendChild(
        control
    );


    fieldsGrid.appendChild(
        wrapper
    );
}


// ======================================================
// LADEN
// ======================================================

t.render(function () {

    loaded =
        false;


    canWrite =
        t.memberCanWriteToModel(
            'card'
        );


    return Promise.all([

        t.get(
            'board',
            'shared',
            'ctSchema',
            null
        ),

        t.get(
            'card',
            'shared',
            'characterData',
            {}
        ),

        t.list(
            'name'
        )

    ]).then(function (values) {

        schema =
            ctDecodeSchema(
                values[0]
            );


        storedValues =
            extractValues(
                values[1]
            );


        currentListName =
            values[2] &&
            values[2].name

                ? values[2].name

                : '';


        fieldsGrid.innerHTML =
            '';


        (
            schema.fields ||
            []
        ).forEach(
            renderField
        );


        checkPlausibility();


        status.textContent =
            canWrite

                ? 'Änderungen werden automatisch gespeichert.'

                : 'Nur-Lese-Ansicht';


        loaded =
            true;


        return t.sizeTo(
            '#ctFields'
        );

    }).catch(function (error) {

        console.error(
            'CT Fields Load Error:',
            error
        );


        status.textContent =
            'CT Fields konnten nicht geladen werden.';

    });

});
