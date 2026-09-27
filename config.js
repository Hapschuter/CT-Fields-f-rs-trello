(function () {

    // =========================
    // VERFÜGBARE FARBEN
    // =========================

    window.CT_COLOR_OPTIONS = [
        { value: 'light-gray', label: 'Grau' },
        { value: 'red',        label: 'Rot' },
        { value: 'blue',       label: 'Blau' },
        { value: 'green',      label: 'Grün' },
        { value: 'purple',     label: 'Violett / Lila' },
        { value: 'orange',     label: 'Orange' },
        { value: 'yellow',     label: 'Gelb' },
        { value: 'sky',        label: 'Türkis' },
        { value: 'lime',       label: 'Kaki / Grün' }
    ];


    // =========================
    // STANDARD-SCHEMA
    // =========================

    var DEFAULT_SCHEMA = {

        version: 2,

        fields: [

            {
                id: 'unit',
                label: 'Untereinheit',
                type: 'select',
                color: 'light-gray',

                options: [
                    {
                        id: 'muunilinst-10',
                        label: 'Muunilinst 10',
                        color: 'blue'
                    },
                    {
                        id: 'rancor-battalion',
                        label: 'Rancor Battalion',
                        color: 'red'
                    },
                    {
                        id: 'tactical-combat-instructor',
                        label: 'Tactical Combat Instructor',
                        color: 'green'
                    }
                ]
            },


            {
                id: 'rank',
                label: 'Rang',
                type: 'select',
                color: 'light-gray',

                options: [
                    { id: 'private-first-class', label: 'Private First Class', color: 'light-gray' },
                    { id: 'lance-corporal', label: 'Lance Corporal', color: 'purple' },
                    { id: 'corporal', label: 'Corporal', color: 'purple' },

                    { id: 'sergeant', label: 'Sergeant', color: 'green' },
                    { id: 'staff-sergeant', label: 'Staff Sergeant', color: 'green' },
                    { id: 'sergeant-major', label: 'Sergeant Major', color: 'green' },

                    { id: 'lieutenant', label: 'Lieutenant', color: 'blue' },
                    { id: 'first-lieutenant', label: 'First Lieutenant', color: 'blue' },

                    { id: 'captain', label: 'Captain', color: 'red' },
                    { id: 'major', label: 'Major', color: 'orange' },
                    { id: 'commander', label: 'Commander', color: 'yellow' },
                    { id: 'high-general', label: 'High General', color: 'purple' }
                ]
            },


            {
                id: 'position',
                label: 'Position',
                type: 'select',
                color: 'light-gray',

                options: [
                    { id: 'mannschaft', label: 'Mannschaft', color: 'purple' },
                    { id: 'unteroffizierebene', label: 'Unteroffizierebene', color: 'green' },
                    { id: 'fuehrungsebene', label: 'Führungsebene', color: 'blue' },
                    { id: 'hohe-fuehrungsebene', label: 'Hohe Führungsebene', color: 'red' }
                ]
            },


            {
                id: 'adjutant',
                label: 'Adjutant',
                type: 'select',
                color: 'light-gray',

                options: [
                    { id: '5th', label: '5th', color: 'sky' },
                    { id: '41st', label: '41st', color: 'green' },
                    { id: '104th', label: '104th', color: 'light-gray' },
                    { id: '187th', label: '187th', color: 'purple' },
                    { id: '212th', label: '212th', color: 'orange' },
                    { id: '501st', label: '501st', color: 'blue' },

                    { id: 'ctp', label: 'CTP', color: 'lime' },
                    { id: 'gmc', label: 'GMC', color: 'purple' },
                    { id: 'rmc', label: 'RMC', color: 'red' },
                    { id: 'so', label: 'SO', color: 'sky' },
                    { id: 'st', label: 'ST', color: 'red' }
                ]
            },


            {
                id: 'promotion',
                label: 'Letzte Beförderung',
                type: 'date',
                color: 'red',
                options: []
            },


            {
                id: 'testUntil',
                label: 'Testzeit',
                type: 'date',
                color: 'yellow',
                options: []
            },


            {
                id: 'ctId',
                label: 'ID',
                type: 'text',
                color: 'light-gray',
                options: []
            }

        ]
    };


    // =========================
    // CLONE
    // =========================

    window.ctGetDefaultSchema = function () {

        return JSON.parse(
            JSON.stringify(DEFAULT_SCHEMA)
        );

    };


    // =========================
    // KOMPAKT SPEICHERN
    // =========================

    window.ctEncodeSchema = function (schema) {

        var typeMap = {
            select: 's',
            text: 't',
            date: 'd'
        };


        return {

            v: 2,

            f: schema.fields.map(function (field) {

                return [

                    field.id,
                    field.label,
                    typeMap[field.type] || 't',
                    field.color || 'light-gray',

                    (field.options || []).map(function (option) {

                        return [
                            option.id,
                            option.label,
                            option.color || 'light-gray'
                        ];

                    })

                ];

            })

        };

    };


    // =========================
    // KOMPAKT LADEN
    // =========================

    window.ctDecodeSchema = function (raw) {

        if (!raw) {
            return ctGetDefaultSchema();
        }


        if (
            raw.version === 2 &&
            Array.isArray(raw.fields)
        ) {

            return JSON.parse(
                JSON.stringify(raw)
            );

        }


        if (
            raw.v !== 2 ||
            !Array.isArray(raw.f)
        ) {

            return ctGetDefaultSchema();

        }


        var typeMap = {
            s: 'select',
            t: 'text',
            d: 'date'
        };


        return {

            version: 2,

            fields: raw.f.map(function (field) {

                return {

                    id: field[0],

                    label: field[1],

                    type:
                        typeMap[field[2]] || 'text',

                    color:
                        field[3] || 'light-gray',

                    options:
                        (field[4] || []).map(function (option) {

                            return {

                                id: option[0],

                                label: option[1],

                                color:
                                    option[2] || 'light-gray'

                            };

                        })

                };

            })

        };

    };


    // =========================
    // OPTION FINDEN
    // =========================

    window.ctFindOption = function (
        field,
        storedValue
    ) {

        if (
            !field ||
            !storedValue ||
            field.type !== 'select'
        ) {
            return null;
        }


        return (field.options || []).find(
            function (option) {

                // Unterstützt auch unsere alten Testdaten,
                // bei denen der sichtbare Name gespeichert wurde.

                return (
                    option.id === storedValue ||
                    option.label === storedValue
                );

            }
        ) || null;

    };


    // =========================
    // WERT NORMALISIEREN
    // =========================

    window.ctNormalizeValue = function (
        field,
        storedValue
    ) {

        if (!storedValue) {
            return '';
        }


        if (field.type !== 'select') {
            return storedValue;
        }


        var option =
            ctFindOption(
                field,
                storedValue
            );


        return option
            ? option.id
            : storedValue;

    };


    // =========================
    // SICHTBARER TEXT
    // =========================

    window.ctGetDisplayValue = function (
        field,
        storedValue
    ) {

        if (!storedValue) {
            return '';
        }


        if (field.type !== 'select') {
            return storedValue;
        }


        var option =
            ctFindOption(
                field,
                storedValue
            );


        return option
            ? option.label
            : storedValue;

    };


    // =========================
    // FARBE
    // =========================

    window.ctGetValueColor = function (
        field,
        storedValue
    ) {

        if (
            field.type === 'select'
        ) {

            var option =
                ctFindOption(
                    field,
                    storedValue
                );


            return option
                ? option.color
                : 'light-gray';

        }


        return field.color || 'light-gray';

    };

})();
