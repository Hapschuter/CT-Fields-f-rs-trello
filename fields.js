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

    // ==================================================
    // RANG -> POSITION
    // ==================================================

    var positionRules = {

        // Mannschaftsebene

        'private-first-class':
            'mannschaft',

        'lance-corporal':
            'mannschaft',

        'corporal':
            'mannschaft',


        // Unteroffiziersebene

        'sergeant':
            'unteroffizierebene',

        'staff-sergeant':
            'unteroffizierebene',

        'sergeant-major':
            'unteroffizierebene',


        // Führungsebene

        'lieutenant':
            'fuehrungsebene',

        'first-lieutenant':
            'fuehrungsebene',


        // Hohe Führungsebene

        'captain':
            'hohe-fuehrungsebene',

        'major':
            'hohe-fuehrungsebene',

        'commander':
            'hohe-fuehrungsebene'

    };


    // ==================================================
    // TRELLO-LISTE -> RANG
    // ==================================================

    var listRules = {

        'private first class':
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


    if (!rank) {

        plausibilityWarning.style.display =
            'none';

        return;

    }


    // Custom / unbekannte Ränge ignorieren

    if (!positionRules[rank]) {

        plausibilityWarning.style.display =
            'none';

        return;

    }


    // ==================================================
    // 1. RANG <-> POSITION
    // ==================================================

    if (positionField) {

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


    // ==================================================
    // 2. LISTE <-> RANG
    // ==================================================

    var expectedRank =
        listRules[
            normalizeListName(
                currentListName
            )
        ];


    if (
        expectedRank &&
        rank !== expectedRank
    ) {

        plausibilityWarning.style.display =
            'block';

        return;

    }


    // Alles korrekt

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


    // ==================================================
    // GELÖSCHTE / ALTE OPTION
    // ==================================================

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
