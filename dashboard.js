var t =
    window.TrelloPowerUp.iframe();


// ======================================================
// ÜBERWACHTE RANGLISTEN
// ======================================================

var MONITORED_LISTS = [

    'private first class',

    'lance corporal',

    'corporal',

    'sergeant',

    'staff sergeant',

    'sergeant major',

    'lieutenant',

    'first lieutenant',

    'captain',

    'major',

    'commander'

];


// ======================================================
// MITGLIEDER-LISTEN
// ======================================================

/*
 * Private First Class wird überall ausgewertet,
 * zählt aber NICHT zu "Mitglieder gesamt".
 *
 * Commander wird ganz normal mitgezählt.
 */

var MEMBER_LISTS =
    MONITORED_LISTS.filter(
        function (name) {

            return (
                name !==
                'private first class'
            );

        }
    );


var AUTO_REFRESH_MS =
    60000;


// ======================================================
// STATE
// ======================================================

var state = {

    result:
        null,

    search:
        '',

    filter:
        'all',

    loading:
        false,

    lastUpdated:
        null,

    nextRefreshAt:
        null

};


// ======================================================
// DOM
// ======================================================

var els = {

    loading:
        document.getElementById(
            'loading'
        ),

    dashboard:
        document.getElementById(
            'dashboard'
        ),

    error:
        document.getElementById(
            'error'
        ),

    refreshButton:
        document.getElementById(
            'refreshButton'
        ),

    lastUpdated:
        document.getElementById(
            'lastUpdated'
        ),

    autoRefreshInfo:
        document.getElementById(
            'autoRefreshInfo'
        ),

    searchInput:
        document.getElementById(
            'searchInput'
        ),

    clearSearchButton:
        document.getElementById(
            'clearSearchButton'
        ),

    filterInfo:
        document.getElementById(
            'filterInfo'
        ),

    memberCount:
        document.getElementById(
            'memberCount'
        ),

    testCount:
        document.getElementById(
            'testCount'
        ),

    incompleteCount:
        document.getElementById(
            'incompleteCount'
        ),

    plausibilityCount:
        document.getElementById(
            'plausibilityCount'
        ),

    rankDistribution:
        document.getElementById(
            'rankDistribution'
        ),

    unitDistribution:
        document.getElementById(
            'unitDistribution'
        ),

    testRunningCount:
        document.getElementById(
            'testRunningCount'
        ),

    testSoonCount:
        document.getElementById(
            'testSoonCount'
        ),

    testExpiredCount:
        document.getElementById(
            'testExpiredCount'
        ),

    testRows:
        document.getElementById(
            'testRows'
        ),

    filteredPanel:
        document.getElementById(
            'filteredPanel'
        ),

    filteredTitle:
        document.getElementById(
            'filteredTitle'
        ),

    filteredRows:
        document.getElementById(
            'filteredRows'
        ),

    issueRows:
        document.getElementById(
            'issueRows'
        ),

    duplicateRows:
        document.getElementById(
            'duplicateRows'
        ),

    copyIssuesButton:
        document.getElementById(
            'copyIssuesButton'
        )

};


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
// VALUE
// ======================================================

function hasValue(value) {

    return (

        value !== null &&

        value !== undefined &&

        String(value)
            .trim()
            .length > 0

    );
}


// ======================================================
// HTML
// ======================================================

function escapeHtml(value) {

    return String(value || '')

        .replace(
            /&/g,
            '&amp;'
        )

        .replace(
            /</g,
            '&lt;'
        )

        .replace(
            />/g,
            '&gt;'
        )

        .replace(
            /"/g,
            '&quot;'
        )

        .replace(
            /'/g,
            '&#039;'
        );
}


// ======================================================
// DATUM
// ======================================================

function parseDate(value) {

    if (!value) {

        return null;

    }


    var parts =
        String(value)
            .split('-');


    if (
        parts.length !== 3
    ) {

        return null;

    }


    var date =
        new Date(

            Number(
                parts[0]
            ),

            Number(
                parts[1]
            ) - 1,

            Number(
                parts[2]
            )

        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;
}


function getToday() {

    var today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return today;
}


function formatDate(value) {

    if (!value) {

        return '';

    }


    var parts =
        String(value)
            .split('-');


    if (
        parts.length !== 3
    ) {

        return value;

    }


    return (
        parts[2] +
        '.' +
        parts[1] +
        '.' +
        parts[0]
    );
}


function formatTime(date) {

    if (!date) {

        return '–';

    }


    return date.toLocaleTimeString(
        'de-AT',
        {
            hour:
                '2-digit',

            minute:
                '2-digit',

            second:
                '2-digit'
        }
    );
}


// ======================================================
// TESTZEIT
// ======================================================

function getTestStatus(value) {

    var date =
        parseDate(
            value
        );


    if (!date) {

        return null;

    }


    var difference =
        Math.round(

            (
                date.getTime() -
                getToday().getTime()
            )

            /

            86400000

        );


    // Bereits abgelaufen

    if (
        difference < 0
    ) {

        return {

            id:
                'expired',

            label:
                'Abgelaufen',

            days:
                difference

        };

    }


    // Heute bis einschließlich 3 Tage

    if (
        difference <= 3
    ) {

        return {

            id:
                'soon',

            label:
                'Läuft bald ab',

            days:
                difference

        };

    }


    return {

        id:
            'running',

        label:
            'Läuft',

        days:
            difference

    };
}


// ======================================================
// CT FARBEN
// ======================================================

function getCtColorHex(color) {

    var colors = {

        'light-gray':
            '#6b778c',

        'red':
            '#c9372c',

        'blue':
            '#0c66e4',

        'green':
            '#1f845a',

        'purple':
            '#6e5dc6',

        'orange':
            '#e56910',

        'yellow':
            '#b38600',

        'sky':
            '#0e7c86',

        'lime':
            '#5b7f24'

    };


    return (
        colors[color] ||
        colors['light-gray']
    );
}


// ======================================================
// PFLICHTFELDER
// ======================================================

function getMissingFields(
    schema,
    values
) {

    var required = [

        {
            id:
                'rank',

            fallback:
                'Rang'
        },

        {
            id:
                'position',

            fallback:
                'Position'
        },

        {
            id:
                'promotion',

            fallback:
                'Letzte Beförderung'
        },

        {
            id:
                'ctId',

            fallback:
                'ID'
        }

    ];


    var missing =
        [];


    required.forEach(
        function (requiredField) {

            if (
                hasValue(
                    values[
                        requiredField.id
                    ]
                )
            ) {

                return;

            }


            var field =
                getField(
                    schema,
                    requiredField.id
                );


            missing.push(

                field
                    ? field.label
                    : requiredField.fallback

            );

        }
    );


    return missing;
}


// ======================================================
// PLAUSIBILITÄT
// ======================================================

function getPlausibilityIssues(
    schema,
    values,
    listName
) {

    // ==================================================
    // RANG -> POSITION
    // ==================================================

    var positionRules = {

        'private-first-class':
            'mannschaft',

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


    // ==================================================
    // LISTE -> RANG
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


    var issues =
        [];


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

        return issues;

    }


    var rank =
        ctNormalizeValue(
            rankField,
            values.rank || ''
        );


    /*
     * Kein Rang oder ein custom Rang:
     * keine Plausibilitätsprüfung.
     */

    if (
        !rank ||
        !positionRules[rank]
    ) {

        return issues;

    }


    // ==================================================
    // RANG <-> POSITION
    // ==================================================

    if (positionField) {

        var position =
            ctNormalizeValue(
                positionField,
                values.position || ''
            );


        if (
            position !==
            positionRules[rank]
        ) {

            issues.push({

                kind:
                    'rank-position',

                text:
                    'Plausibilität: Rang ↔ Position',

                severity:
                    'warning',

                priority:
                    70

            });

        }

    }


    // ==================================================
    // LISTE <-> RANG
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

        issues.push({

            kind:
                'list-rank',

            text:
                'Plausibilität: Liste ↔ Rang',

            severity:
                'warning',

            priority:
                75

        });

    }


    return issues;
}


// ======================================================
// KARTE ÖFFNEN
// ======================================================

function openCard(card) {

    var cardId =
        card.shortLink ||
        card.id;


    return t.showCard(
        cardId
    )

    .then(
        function () {

            return t.closeModal();

        }
    )

    .catch(
        function (error) {

            console.error(
                'CT Dashboard Card Open Error:',
                error
            );

        }
    );
}


// ======================================================
// BOARD ANALYSIEREN
// ======================================================

function analyze(
    schema,
    cards,
    lists
) {

    var listMap =
        {};


    lists.forEach(
        function (list) {

            listMap[
                list.id
            ] = {

                id:
                    list.id,

                name:
                    list.name,

                normalized:
                    normalizeListName(
                        list.name
                    )

            };

        }
    );


    // Nur Karten aus unseren Ranglisten

    var relevantCards =
        cards.filter(
            function (card) {

                var list =
                    listMap[
                        card.idList
                    ];


                return (

                    list &&

                    MONITORED_LISTS.indexOf(
                        list.normalized
                    ) !== -1

                );

            }
        );


    return Promise.all(

        relevantCards.map(
            function (card) {

                return t.get(

                    card.id,

                    'shared',

                    'characterData',

                    {}

                ).then(
                    function (data) {

                        return {

                            card:
                                card,

                            list:
                                listMap[
                                    card.idList
                                ],

                            values:
                                getStoredValues(
                                    data
                                )

                        };

                    }
                );

            }
        )

    ).then(
        function (items) {

            return buildResult(
                schema,
                items
            );

        }
    );
}


// ======================================================
// RESULT
// ======================================================

function buildResult(
    schema,
    sourceItems
) {

    var result = {

        memberCount:
            0,

        testCount:
            0,

        incompleteCount:
            0,

        plausibilityCount:
            0,

        testRunning:
            0,

        testSoon:
            0,

        testExpired:
            0,

        items:
            [],

        tests:
            [],

        issues:
            [],

        duplicateIds:
            [],

        ranks:
            [],

        units:
            []

    };


    var rankField =
        getField(
            schema,
            'rank'
        );


    var unitField =
        getField(
            schema,
            'unit'
        );


    var rankMap =
        {};


    var unitMap =
        {};


    var ids =
        {};


    // ==================================================
    // RÄNGE INITIALISIEREN
    // ==================================================

    if (rankField) {

        (
            rankField.options ||
            []
        ).forEach(
            function (option) {

                rankMap[
                    option.id
                ] = {

                    id:
                        option.id,

                    label:
                        option.label,

                    color:
                        option.color,

                    count:
                        0

                };

            }
        );

    }


    // ==================================================
    // UNTEREINHEITEN INITIALISIEREN
    // ==================================================

    if (unitField) {

        (
            unitField.options ||
            []
        ).forEach(
            function (option) {

                unitMap[
                    option.id
                ] = {

                    id:
                        option.id,

                    label:
                        option.label,

                    color:
                        option.color,

                    count:
                        0

                };

            }
        );

    }


    // ==================================================
    // KARTEN DURCHGEHEN
    // ==================================================

    sourceItems.forEach(
        function (source) {

            var card =
                source.card;


            var values =
                source.values;


            var listName =
                source.list.normalized;


            /*
             * PFC = false
             *
             * Alle anderen überwachten Listen,
             * inklusive Commander = true.
             */

            var isMember =
                MEMBER_LISTS.indexOf(
                    listName
                ) !== -1;


            var missing =
                getMissingFields(
                    schema,
                    values
                );


            var plausibilityIssues =
                getPlausibilityIssues(
                    schema,
                    values,
                    listName
                );


            var testStatus =
                hasValue(
                    values.testUntil
                )
                    ? getTestStatus(
                        values.testUntil
                    )
                    : null;


            var ctId =
                hasValue(
                    values.ctId
                )
                    ? String(
                        values.ctId
                    ).trim()
                    : '';


            var rankId =
                rankField &&
                values.rank

                    ? ctNormalizeValue(
                        rankField,
                        values.rank
                    )

                    : '';


            var unitId =
                unitField &&
                values.unit

                    ? ctNormalizeValue(
                        unitField,
                        values.unit
                    )

                    : '';


            var item = {

                card:
                    card,

                list:
                    source.list,

                values:
                    values,

                isMember:
                    isMember,

                missing:
                    missing,

                plausibilityIssues:
                    plausibilityIssues,

                testStatus:
                    testStatus,

                ctId:
                    ctId,

                rankId:
                    rankId,

                unitId:
                    unitId,

                duplicateId:
                    false,

                problems:
                    []

            };


            // ==================================================
            // MITGLIEDER GESAMT
            // ==================================================

            if (isMember) {

                result.memberCount++;

            }


            // ==================================================
            // RANGVERTEILUNG
            // ==================================================

            if (
                rankId &&
                rankMap[
                    rankId
                ]
            ) {

                rankMap[
                    rankId
                ].count++;

            }


            // ==================================================
            // UNTEREINHEITEN
            // ==================================================

            if (
                unitId &&
                unitMap[
                    unitId
                ]
            ) {

                unitMap[
                    unitId
                ].count++;

            }


            // ==================================================
            // UNVOLLSTÄNDIG
            // ==================================================

            if (
                missing.length > 0
            ) {

                result.incompleteCount++;


                missing.forEach(
                    function (name) {

                        item.problems.push({

                            kind:
                                'missing',

                            text:
                                name +
                                ' fehlt',

                            severity:
                                'muted',

                            priority:
                                20

                        });

                    }
                );

            }


            // ==================================================
            // PLAUSIBILITÄT
            // ==================================================

            if (
                plausibilityIssues.length >
                0
            ) {

                result.plausibilityCount++;


                plausibilityIssues.forEach(
                    function (problem) {

                        item.problems.push(
                            problem
                        );

                    }
                );

            }


            // ==================================================
            // TESTZEIT
            // ==================================================

            if (
                hasValue(
                    values.testUntil
                )
            ) {

                /*
                 * Jede gesetzte Testzeit zählt:
                 *
                 * läuft
                 * bald ablaufend
                 * abgelaufen
                 */

                result.testCount++;


                if (testStatus) {

                    if (
                        testStatus.id ===
                        'running'
                    ) {

                        result.testRunning++;

                    }


                    if (
                        testStatus.id ===
                        'soon'
                    ) {

                        result.testSoon++;

                    }


                    if (
                        testStatus.id ===
                        'expired'
                    ) {

                        result.testExpired++;

                    }


                    result.tests.push({

                        card:
                            card,

                        item:
                            item,

                        date:
                            values.testUntil,

                        status:
                            testStatus

                    });


                    if (
                        testStatus.id ===
                        'soon'
                    ) {

                        item.problems.push({

                            kind:
                                'test-soon',

                            text:
                                'Testzeit läuft bald ab',

                            severity:
                                'warning',

                            priority:
                                60

                        });

                    }


                    if (
                        testStatus.id ===
                        'expired'
                    ) {

                        item.problems.push({

                            kind:
                                'test-expired',

                            text:
                                'Testzeit abgelaufen',

                            severity:
                                'error',

                            priority:
                                90

                        });

                    }

                }

            }


            // ==================================================
            // ID SAMMELN
            // ==================================================

            if (ctId) {

                var normalizedId =
                    ctId.toLowerCase();


                if (
                    !ids[
                        normalizedId
                    ]
                ) {

                    ids[
                        normalizedId
                    ] = {

                        display:
                            ctId,

                        items:
                            []

                    };

                }


                ids[
                    normalizedId
                ].items.push(
                    item
                );

            }


            result.items.push(
                item
            );

        }
    );


    // ==================================================
    // DOPPELTE IDS
    // ==================================================

    Object.keys(
        ids
    ).forEach(
        function (key) {

            var group =
                ids[key];


            if (
                group.items.length <= 1
            ) {

                return;

            }


            result.duplicateIds.push({

                id:
                    group.display,

                items:
                    group.items

            });


            group.items.forEach(
                function (item) {

                    item.duplicateId =
                        true;


                    item.problems.push({

                        kind:
                            'duplicate-id',

                        text:
                            'ID doppelt vergeben',

                        severity:
                            'error',

                        priority:
                            100

                    });

                }
            );

        }
    );


    // ==================================================
    // AUFFÄLLIGKEITEN
    // ==================================================

    result.issues =
        result.items.filter(
            function (item) {

                return (
                    item.problems.length >
                    0
                );

            }
        );


    /*
     * Priorität:
     *
     * 100 = Doppelte ID
     * 90  = Testzeit abgelaufen
     * 75  = Liste ↔ Rang
     * 70  = Rang ↔ Position
     * 60  = Testzeit läuft bald ab
     * 20  = Pflichtfeld fehlt
     */

    result.issues.sort(
        function (
            a,
            b
        ) {

            var aPriority =
                getItemPriority(
                    a
                );


            var bPriority =
                getItemPriority(
                    b
                );


            if (
                aPriority !==
                bPriority
            ) {

                return (
                    bPriority -
                    aPriority
                );

            }


            return a.card.name.localeCompare(
                b.card.name,
                'de'
            );

        }
    );


    // ==================================================
    // TESTZEITEN SORTIEREN
    // ==================================================

    result.tests.sort(
        function (
            a,
            b
        ) {

            var weights = {

                expired:
                    0,

                soon:
                    1,

                running:
                    2

            };


            if (
                weights[
                    a.status.id
                ] !==
                weights[
                    b.status.id
                ]
            ) {

                return (

                    weights[
                        a.status.id
                    ]

                    -

                    weights[
                        b.status.id
                    ]

                );

            }


            return (

                parseDate(
                    a.date
                )

                -

                parseDate(
                    b.date
                )

            );

        }
    );


    // ==================================================
    // VERTEILUNGEN
    // ==================================================

    result.ranks =
        Object.keys(
            rankMap
        ).map(
            function (key) {

                return rankMap[
                    key
                ];

            }
        );


    result.units =
        Object.keys(
            unitMap
        ).map(
            function (key) {

                return unitMap[
                    key
                ];

            }
        );


    result.items.sort(
        function (
            a,
            b
        ) {

            return a.card.name.localeCompare(
                b.card.name,
                'de'
            );

        }
    );


    return result;
}


// ======================================================
// PRIORITÄT
// ======================================================

function getItemPriority(item) {

    if (
        !item.problems ||
        item.problems.length === 0
    ) {

        return 0;

    }


    return Math.max.apply(

        null,

        item.problems.map(
            function (problem) {

                return (
                    problem.priority ||
                    0
                );

            }
        )

    );
}


// ======================================================
// SUCHE
// ======================================================

function matchesSearch(item) {

    var query =
        state.search
            .trim()
            .toLowerCase();


    if (!query) {

        return true;

    }


    var name =
        String(
            item.card.name ||
            ''
        ).toLowerCase();


    var id =
        String(
            item.ctId ||
            ''
        ).toLowerCase();


    return (

        name.indexOf(
            query
        ) !== -1

        ||

        id.indexOf(
            query
        ) !== -1

    );
}


// ======================================================
// KPI FILTER
// ======================================================

function matchesFilter(item) {

    if (
        state.filter ===
        'members'
    ) {

        return item.isMember;

    }


    if (
        state.filter ===
        'tests'
    ) {

        return hasValue(
            item.values.testUntil
        );

    }


    if (
        state.filter ===
        'incomplete'
    ) {

        return (
            item.missing.length >
            0
        );

    }


    if (
        state.filter ===
        'plausibility'
    ) {

        return (
            item.plausibilityIssues.length >
            0
        );

    }


    return true;
}


// ======================================================
// GEFILTERTE ITEMS
// ======================================================

function getFilteredItems() {

    if (!state.result) {

        return [];

    }


    return state.result.items.filter(
        function (item) {

            return (

                matchesSearch(
                    item
                )

                &&

                matchesFilter(
                    item
                )

            );

        }
    );
}


function getVisibleItemIds() {

    var ids =
        {};


    getFilteredItems().forEach(
        function (item) {

            ids[
                item.card.id
            ] =
                true;

        }
    );


    return ids;
}


// ======================================================
// HAUPT-RENDER
// ======================================================

function renderResult(result) {

    els.memberCount.textContent =
        result.memberCount;


    els.testCount.textContent =
        result.testCount;


    els.incompleteCount.textContent =
        result.incompleteCount;


    els.plausibilityCount.textContent =
        result.plausibilityCount;


    els.testRunningCount.textContent =
        result.testRunning;


    els.testSoonCount.textContent =
        result.testSoon;


    els.testExpiredCount.textContent =
        result.testExpired;


    renderDistribution(

        result.ranks,

        els.rankDistribution,

        'Keine Ränge konfiguriert.'

    );


    renderDistribution(

        result.units,

        els.unitDistribution,

        'Keine Untereinheiten konfiguriert.'

    );


    renderFilteredViews();
}


// ======================================================
// VERTEILUNG
// ======================================================

function renderDistribution(
    items,
    container,
    emptyText
) {

    container.innerHTML =
        '';


    if (!items.length) {

        container.innerHTML =

            '<div class="empty">' +

                escapeHtml(
                    emptyText
                ) +

            '</div>';


        return;

    }


    var max =
        Math.max.apply(

            null,

            items.map(
                function (item) {

                    return item.count;

                }
            )

            .concat(
                [1]
            )

        );


    items.forEach(
        function (item) {

            var row =
                document.createElement(
                    'div'
                );


            row.className =
                'distribution-row';


            var width =
                (
                    item.count /
                    max
                ) * 100;


            row.innerHTML =

                '<div ' +

                    'class="distribution-name" ' +

                    'title="' +
                    escapeHtml(
                        item.label
                    ) +
                    '">' +

                    escapeHtml(
                        item.label
                    ) +

                '</div>' +


                '<div class="distribution-track">' +

                    '<div ' +

                        'class="distribution-fill" ' +

                        'style="' +

                            'width:' +
                            width +
                            '%;' +

                            'background:' +
                            getCtColorHex(
                                item.color
                            ) +

                        '">' +

                    '</div>' +

                '</div>' +


                '<div class="distribution-count">' +

                    item.count +

                '</div>';


            container.appendChild(
                row
            );

        }
    );
}


// ======================================================
// FILTER VIEWS
// ======================================================

function renderFilteredViews() {

    if (!state.result) {

        return;

    }


    updateKpiState();

    updateFilterInfo();


    var visibleIds =
        getVisibleItemIds();


    renderFilteredCards(
        getFilteredItems()
    );


    renderTests(

        state.result.tests.filter(
            function (test) {

                return visibleIds[
                    test.card.id
                ];

            }
        )

    );


    renderIssues(

        state.result.issues.filter(
            function (item) {

                return visibleIds[
                    item.card.id
                ];

            }
        )

    );


    renderDuplicates(

        state.result.duplicateIds,

        visibleIds

    );
}


// ======================================================
// KPI STATUS
// ======================================================

function updateKpiState() {

    document.querySelectorAll(
        '.stat-card[data-filter]'
    ).forEach(
        function (card) {

            card.classList.toggle(

                'active',

                card.getAttribute(
                    'data-filter'
                ) ===
                state.filter

            );

        }
    );
}


// ======================================================
// FILTER INFO
// ======================================================

function updateFilterInfo() {

    var labels = {

        members:
            'Mitglieder gesamt',

        tests:
            'Aktive Testzeiten',

        incomplete:
            'Unvollständige Karten',

        plausibility:
            'Plausibilitätsfehler'

    };


    var parts =
        [];


    if (
        state.filter !==
        'all'
    ) {

        parts.push(
            'Filter: ' +
            labels[
                state.filter
            ]
        );

    }


    if (state.search) {

        parts.push(
            'Suche: „' +
            state.search +
            '“'
        );

    }


    if (!parts.length) {

        els.filterInfo.classList.remove(
            'visible'
        );


        els.filterInfo.textContent =
            '';


        return;

    }


    els.filterInfo.textContent =

        parts.join(
            ' · '
        )

        +

        ' · '

        +

        getFilteredItems().length

        +

        ' Karte(n)';


    els.filterInfo.classList.add(
        'visible'
    );
}


// ======================================================
// FILTERERGEBNISSE
// ======================================================

function renderFilteredCards(items) {

    var shouldShow =

        state.filter !==
        'all'

        ||

        state.search.length >
        0;


    els.filteredPanel.style.display =
        shouldShow
            ? 'block'
            : 'none';


    if (!shouldShow) {

        return;

    }


    els.filteredTitle.textContent =

        state.search
            ? 'Such-/Filterergebnisse'
            : 'Gefilterte Karten';


    els.filteredRows.innerHTML =
        '';


    if (!items.length) {

        els.filteredRows.innerHTML =

            '<div class="empty">' +

                'Keine passenden Karten gefunden.' +

            '</div>';


        return;

    }


    items.forEach(
        function (item) {

            var row =
                document.createElement(
                    'div'
                );


            row.className =
                'card-result-row';


            var meta =
                [];


            if (item.ctId) {

                meta.push(
                    'ID ' +
                    item.ctId
                );

            }


            meta.push(
                item.list.name
            );


            row.innerHTML =

                '<div>' +

                    '<div class="card-name">' +

                        escapeHtml(
                            item.card.name
                        ) +

                    '</div>' +

                    '<div class="subtext">' +

                        escapeHtml(
                            meta.join(
                                ' · '
                            )
                        ) +

                    '</div>' +

                '</div>' +


                '<span class="open-hint">' +

                    'Öffnen ›' +

                '</span>';


            row.addEventListener(
                'click',
                function () {

                    openCard(
                        item.card
                    );

                }
            );


            els.filteredRows.appendChild(
                row
            );

        }
    );
}


// ======================================================
// TESTZEITEN
// ======================================================

function renderTests(tests) {

    els.testRows.innerHTML =
        '';


    if (!tests.length) {

        els.testRows.innerHTML =

            '<div class="empty">' +

                'Keine passenden Testzeiten.' +

            '</div>';


        return;

    }


    tests.forEach(
        function (item) {

            var row =
                document.createElement(
                    'div'
                );


            row.className =
                'data-row';


            var badgeClass =
                'badge-green';


            if (
                item.status.id ===
                'soon'
            ) {

                badgeClass =
                    'badge-yellow';

            }


            if (
                item.status.id ===
                'expired'
            ) {

                badgeClass =
                    'badge-red';

            }


            row.innerHTML =

                '<div>' +

                    '<div class="card-name">' +

                        escapeHtml(
                            item.card.name
                        ) +

                    '</div>' +

                    '<div class="subtext">' +

                        escapeHtml(
                            formatDate(
                                item.date
                            )
                        ) +

                    '</div>' +

                '</div>' +


                '<span class="badge ' +
                    badgeClass +
                '">' +

                    escapeHtml(
                        item.status.label
                    ) +

                '</span>';


            row.addEventListener(
                'click',
                function () {

                    openCard(
                        item.card
                    );

                }
            );


            els.testRows.appendChild(
                row
            );

        }
    );
}


// ======================================================
// ISSUE STYLE
// ======================================================

function getIssueClass(problem) {

    if (
        problem.severity ===
        'error'
    ) {

        return 'issue-error';

    }


    if (
        problem.severity ===
        'warning'
    ) {

        return 'issue-warning';

    }


    return 'issue-muted';
}


// ======================================================
// AUFFÄLLIGKEITEN
// ======================================================

function renderIssues(issues) {

    els.issueRows.innerHTML =
        '';


    els.copyIssuesButton.disabled =
        issues.length === 0;


    if (!issues.length) {

        els.issueRows.innerHTML =

            '<div class="empty">' +

                '✓ Keine passenden Auffälligkeiten gefunden.' +

            '</div>';


        return;

    }


    issues.forEach(
        function (item) {

            var row =
                document.createElement(
                    'div'
                );


            row.className =
                'issue-row';


            var tags =
                item.problems

                .slice()

                .sort(
                    function (
                        a,
                        b
                    ) {

                        return (

                            (
                                b.priority ||
                                0
                            )

                            -

                            (
                                a.priority ||
                                0
                            )

                        );

                    }
                )

                .map(
                    function (problem) {

                        return (

                            '<span class="issue ' +

                                getIssueClass(
                                    problem
                                ) +

                            '">' +

                                escapeHtml(
                                    problem.text
                                ) +

                            '</span>'

                        );

                    }
                )

                .join('');


            var meta =
                item.ctId

                    ? (
                        'ID ' +
                        item.ctId +
                        ' · ' +
                        item.list.name
                    )

                    : item.list.name;


            row.innerHTML =

                '<div>' +

                    '<div class="card-name">' +

                        escapeHtml(
                            item.card.name
                        ) +

                    '</div>' +

                    '<div class="subtext">' +

                        escapeHtml(
                            meta
                        ) +

                    '</div>' +

                '</div>' +


                '<div class="issue-tags">' +

                    tags +

                '</div>';


            row.addEventListener(
                'click',
                function () {

                    openCard(
                        item.card
                    );

                }
            );


            els.issueRows.appendChild(
                row
            );

        }
    );
}


// ======================================================
// DOPPELTE IDS
// ======================================================

function renderDuplicates(
    groups,
    visibleIds
) {

    els.duplicateRows.innerHTML =
        '';


    var visibleGroups =
        groups.map(
            function (group) {

                return {

                    id:
                        group.id,

                    items:
                        group.items.filter(
                            function (item) {

                                return visibleIds[
                                    item.card.id
                                ];

                            }
                        )

                };

            }
        )

        .filter(
            function (group) {

                return (
                    group.items.length >
                    0
                );

            }
        );


    if (!visibleGroups.length) {

        els.duplicateRows.innerHTML =

            '<div class="empty">' +

                '✓ Keine passenden doppelten IDs gefunden.' +

            '</div>';


        return;

    }


    visibleGroups.forEach(
        function (group) {

            var wrapper =
                document.createElement(
                    'div'
                );


            wrapper.className =
                'duplicate-group';


            var title =
                document.createElement(
                    'div'
                );


            title.className =
                'duplicate-id';


            title.textContent =
                'ID ' +
                group.id;


            wrapper.appendChild(
                title
            );


            group.items.forEach(
                function (item) {

                    var button =
                        document.createElement(
                            'button'
                        );


                    button.type =
                        'button';


                    button.className =
                        'duplicate-card';


                    button.textContent =
                        item.card.name;


                    button.addEventListener(
                        'click',
                        function () {

                            openCard(
                                item.card
                            );

                        }
                    );


                    wrapper.appendChild(
                        button
                    );

                }
            );


            els.duplicateRows.appendChild(
                wrapper
            );

        }
    );
}


// ======================================================
// SICHTBARE AUFFÄLLIGKEITEN
// ======================================================

function getVisibleIssues() {

    if (!state.result) {

        return [];

    }


    var visibleIds =
        getVisibleItemIds();


    return state.result.issues.filter(
        function (item) {

            return visibleIds[
                item.card.id
            ];

        }
    );
}


// ======================================================
// DISCORD TEXT
// ======================================================

function buildDiscordIssueText(issues) {

    var lines =
        [];


    lines.push(
        '**CT Auffälligkeiten**'
    );


    lines.push(

        'Stand: ' +

        new Date()
            .toLocaleString(
                'de-AT'
            )

    );


    lines.push(
        ''
    );


    issues.forEach(
        function (item) {

            var idText =
                item.ctId

                    ? (
                        ' | ID ' +
                        item.ctId
                    )

                    : '';


            lines.push(

                '**' +
                item.card.name +
                '**' +
                idText

            );


            item.problems

                .slice()

                .sort(
                    function (
                        a,
                        b
                    ) {

                        return (

                            (
                                b.priority ||
                                0
                            )

                            -

                            (
                                a.priority ||
                                0
                            )

                        );

                    }
                )

                .forEach(
                    function (problem) {

                        var symbol =

                            problem.severity ===
                            'error'

                                ? '🔴'

                                : (
                                    problem.severity ===
                                    'warning'

                                        ? '⚠️'

                                        : '•'
                                );


                        lines.push(

                            symbol +
                            ' ' +
                            problem.text

                        );

                    }
                );


            lines.push(
                ''
            );

        }
    );


    return lines
        .join('\n')
        .trim();
}


// ======================================================
// COPY
// ======================================================

function copyText(text) {

    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        return navigator.clipboard.writeText(
            text
        );

    }


    return new Promise(
        function (
            resolve,
            reject
        ) {

            try {

                var textarea =
                    document.createElement(
                        'textarea'
                    );


                textarea.value =
                    text;


                textarea.style.position =
                    'fixed';


                textarea.style.opacity =
                    '0';


                document.body.appendChild(
                    textarea
                );


                textarea.focus();

                textarea.select();


                var ok =
                    document.execCommand(
                        'copy'
                    );


                document.body.removeChild(
                    textarea
                );


                if (!ok) {

                    throw new Error(
                        'copy-failed'
                    );

                }


                resolve();

            } catch (error) {

                reject(
                    error
                );

            }

        }
    );
}


// ======================================================
// COPY BUTTON
// ======================================================

function flashCopyButton(text) {

    var original =
        'Auffälligkeiten kopieren';


    els.copyIssuesButton.textContent =
        text;


    setTimeout(
        function () {

            els.copyIssuesButton.textContent =
                original;

        },
        1800
    );
}


// ======================================================
// DASHBOARD LADEN
// ======================================================

function loadDashboard(options) {

    options =
        options || {};


    if (
        state.loading
    ) {

        return Promise.resolve();

    }


    state.loading =
        true;


    els.refreshButton.disabled =
        true;


    els.error.style.display =
        'none';


    if (
        !options.silent ||
        !state.result
    ) {

        els.loading.style.display =
            'block';


        els.dashboard.style.display =
            'none';

    }


    return Promise.all([

        t.get(
            'board',
            'shared',
            'ctSchema',
            null
        ),

        t.cards(
            'id',
            'name',
            'idList',
            'url',
            'shortLink'
        ),

        t.lists(
            'id',
            'name'
        )

    ])

    .then(
        function (values) {

            var schema =
                ctDecodeSchema(
                    values[0]
                );


            return analyze(

                schema,

                values[1] ||
                [],

                values[2] ||
                []

            );

        }
    )

    .then(
        function (result) {

            state.result =
                result;


            state.lastUpdated =
                new Date();


            state.nextRefreshAt =
                Date.now() +
                AUTO_REFRESH_MS;


            renderResult(
                result
            );


            els.lastUpdated.textContent =

                'Zuletzt aktualisiert: ' +

                formatTime(
                    state.lastUpdated
                );


            els.loading.style.display =
                'none';


            els.dashboard.style.display =
                'block';

        }
    )

    .catch(
        function (error) {

            console.error(
                'CT Dashboard Error:',
                error
            );


            els.error.textContent =

                'CT Overview konnte nicht geladen werden: '

                +

                (
                    error.message ||
                    'Unbekannter Fehler'
                );


            els.error.style.display =
                'block';


            els.loading.style.display =
                'none';


            if (
                state.result
            ) {

                els.dashboard.style.display =
                    'block';

            }

        }
    )

    .then(
        function () {

            state.loading =
                false;


            els.refreshButton.disabled =
                false;

        }
    );
}


// ======================================================
// AUTO REFRESH
// ======================================================

function updateAutoRefreshInfo() {

    if (
        !state.nextRefreshAt
    ) {

        els.autoRefreshInfo.textContent =
            'Auto-Refresh: 60 s';


        return;

    }


    var seconds =
        Math.max(

            0,

            Math.ceil(

                (
                    state.nextRefreshAt -
                    Date.now()
                )

                /

                1000

            )

        );


    els.autoRefreshInfo.textContent =

        'Auto-Refresh in ' +
        seconds +
        ' s';


    if (
        seconds <= 0 &&
        !state.loading
    ) {

        loadDashboard({

            silent:
                true

        });

    }
}


// ======================================================
// MANUELL REFRESH
// ======================================================

els.refreshButton.addEventListener(
    'click',
    function () {

        loadDashboard({

            silent:
                !!state.result

        });

    }
);


// ======================================================
// SUCHE
// ======================================================

els.searchInput.addEventListener(
    'input',
    function () {

        state.search =
            els.searchInput.value
                .trim();


        els.clearSearchButton.style.visibility =

            state.search
                ? 'visible'
                : 'hidden';


        renderFilteredViews();

    }
);


els.clearSearchButton.addEventListener(
    'click',
    function () {

        els.searchInput.value =
            '';


        state.search =
            '';


        els.clearSearchButton.style.visibility =
            'hidden';


        renderFilteredViews();


        els.searchInput.focus();

    }
);


// ======================================================
// KPI KLICK
// ======================================================

document.querySelectorAll(
    '.stat-card[data-filter]'
).forEach(
    function (card) {

        card.addEventListener(
            'click',
            function () {

                var selected =
                    card.getAttribute(
                        'data-filter'
                    );


                state.filter =

                    state.filter ===
                    selected

                        ? 'all'

                        : selected;


                renderFilteredViews();

            }
        );


        card.addEventListener(
            'keydown',
            function (event) {

                if (
                    event.key ===
                    'Enter'

                    ||

                    event.key ===
                    ' '
                ) {

                    event.preventDefault();


                    card.click();

                }

            }
        );

    }
);


// ======================================================
// AUFFÄLLIGKEITEN KOPIEREN
// ======================================================

els.copyIssuesButton.addEventListener(
    'click',
    function () {

        var issues =
            getVisibleIssues();


        if (!issues.length) {

            return;

        }


        copyText(

            buildDiscordIssueText(
                issues
            )

        )

        .then(
            function () {

                flashCopyButton(
                    'Kopiert ✓'
                );

            }
        )

        .catch(
            function (error) {

                console.error(
                    'CT Dashboard Copy Error:',
                    error
                );


                flashCopyButton(
                    'Kopieren fehlgeschlagen'
                );

            }
        );

    }
);


// ======================================================
// START
// ======================================================

els.clearSearchButton.style.visibility =
    'hidden';


setInterval(
    updateAutoRefreshInfo,
    1000
);


loadDashboard();
