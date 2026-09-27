var t = window.TrelloPowerUp.iframe();

var form = document.getElementById('ctForm');

var unit = document.getElementById('unit');
var rank = document.getElementById('rank');
var position = document.getElementById('position');
var adjutant = document.getElementById('adjutant');
var promotion = document.getElementById('promotion');
var testUntil = document.getElementById('testUntil');
var ctId = document.getElementById('ctId');

var cancelButton = document.getElementById('cancelButton');


// =========================
// DATEN LADEN
// =========================

Promise.all([

    t.get(
        'card',
        'shared',
        'characterData',
        {}
    ),

    // alter Rang aus unserer ersten Version
    t.get(
        'card',
        'shared',
        'rank',
        ''
    )

]).then(function (values) {

    var data = values[0] || {};
    var oldRank = values[1];

    unit.value = data.unit || '';

    rank.value =
        data.rank ||
        oldRank ||
        '';

    position.value =
        data.position ||
        '';

    adjutant.value =
        data.adjutant ||
        '';

    promotion.value =
        data.promotion ||
        '';

    testUntil.value =
        data.testUntil ||
        '';

    ctId.value =
        data.ctId ||
        '';

});


// =========================
// SPEICHERN
// =========================

form.addEventListener(
    'submit',
    function (event) {

        event.preventDefault();

        var characterData = {

            unit:
                unit.value.trim(),

            rank:
                rank.value,

            position:
                position.value,

            adjutant:
                adjutant.value.trim(),

            promotion:
                promotion.value,

            testUntil:
                testUntil.value,

            ctId:
                ctId.value.trim()

        };


        return t.set(
            'card',
            'shared',
            'characterData',
            characterData
        ).then(function () {

            return t.closeModal();

        });

    }
);


// =========================
// ABBRECHEN
// =========================

cancelButton.addEventListener(
    'click',
    function () {

        return t.closeModal();

    }
);
