window.TrelloPowerUp.initialize({

    // ==================================================
    // BOARD BUTTONS
    // ==================================================

    'board-buttons': function (t) {

        return [

            {
                text: 'CT Overview',
                condition: 'edit',

                callback: function (t) {

                    return t.modal({
                        title: 'CT Overview',
                        url: t.signUrl('./dashboard.html'),
                        fullscreen: true
                    });

                }
            },

            {
                text: 'CT Fields',
                condition: 'admin',

                callback: function (t) {

                    return t.modal({
                        title: 'CT Fields – Einstellungen',
                        url: t.signUrl('./settings.html'),
                        height: 720,
                        fullscreen: false
                    });

                }
            }

        ];

    },


    // ==================================================
    // CT FIELDS IN DER GEÖFFNETEN KARTE
    // ==================================================

    'card-back-section': function (t) {

        return {

            title: 'CT Fields',

            icon:
                t.signUrl('./icon.svg'),

            content: {

                type: 'iframe',

                url:
                    t.signUrl('./fields.html'),

                height: 350

            }

        };

    },


    // ==================================================
    // BADGES AUF DER KARTENVORDERSEITE
    // ==================================================

    'card-badges': function (t) {

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

            var schema =
                ctDecodeSchema(
                    values[0]
                );


            var storedValues =
                getStoredValues(
                    values[1] || {}
                );


            var listName =
                values[2] &&
                values[2].name
                    ? values[2].name
                    : '';


            var badges = [];


            // ==================================================
            // NORMALE CT FIELDS
            // ==================================================

            (schema.fields || []).forEach(
                function (field) {

                    var value =
                        storedValues[
                            field.id
                        ];


                    if (!value) {
                        return;
                    }


                    var displayValue =
                        ctGetDisplayValue(
                            field,
                            value
                        );


                    if (
                        field.type ===
                        'date'
                    ) {

                        displayValue =
                            formatDate(
                                displayValue
                            );

                    }


                    badges.push({

                        text:
                            field.label +
                            ': ' +
                            displayValue,

                        color:
                            ctGetValueColor(
                                field,
                                value
                            )

                    });

                }
            );


            // ==================================================
            // PLAUSIBILITÄT
            // ==================================================

            if (
                hasPlausibilityError(
                    schema,
                    storedValues,
                    listName
                )
            ) {

                badges.push({

                    text:
                        '⚠ Plausibilitätsfehler',

                    color:
                        'yellow'

                });

            }


            return badges;

        }).catch(function (error) {

            console.error(
                'CT Fields Badge Error:',
                error
            );


            return [];

        });

    }

});


// ======================================================
// KARTENDATEN
// ======================================================

function getStoredValues(data) {

    if (
        data &&
        data.v === 2 &&
        data.values
    ) {

        return data.values;

    }


    return data || {};
}


// ======================================================
// FIELD FINDEN
// ======================================================

function getField(
    schema,
    id
) {

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
                field.id === id
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
// PLAUSIBILITÄT
// ======================================================

function hasPlausibilityError(
    schema,
    storedValues,
    listName
) {

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
            schema,
            'rank'
        );


    var positionField =
        getField(
            schema,
            'position'
        );


    if (!rankField) {

        return false;

    }


    var rank =
        ctNormalizeValue(
            rankField,
            storedValues.rank || ''
        );


    // Kein Rang = kein Plausibilitätsfehler

    if (!rank) {

        return false;

    }


    // Andere/custom Ränge nicht prüfen

    if (!positionRules[rank]) {

        return false;

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

            return true;

        }

    }


    // ==================================================
    // 2. LISTE <-> RANG
    // ==================================================

    var expectedRank =
        listRules[
            normalizeListName(
                listName
            )
        ];


    if (
        expectedRank &&
        rank !== expectedRank
    ) {

        return true;

    }


    return false;
}


// ======================================================
// DATUM
// ======================================================

function formatDate(dateString) {

    if (!dateString) {

        return '';

    }


    var parts =
        String(dateString)
            .split('-');


    if (
        parts.length !== 3
    ) {

        return dateString;

    }


    return (
        parts[2] +
        '.' +
        parts[1] +
        '.' +
        parts[0]
    );
}
