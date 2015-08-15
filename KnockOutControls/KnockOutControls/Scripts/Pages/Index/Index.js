/// <reference path="../../../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../../../scripts/typings/knockout/knockout.d.ts" />
var model = (function () {
    function model() {
        this.MultiSelectDataPassed = ko.observableArray([]);
        this.MultiSelectSelected = ko.observable('');
        this.SingleSelectSelected = ko.observable('');
        for (var i = 0; i < 10000; i++) {
            this.MultiSelectDataPassed.push({ text: "A" + i, value: "A" + i });
        }
        this.MultiSelectSelection = ko.computed({
            owner: this,
            read: function () {
                var selection = this.MultiSelectSelected();
                var text = '';
                for (var i = 0; i < selection.length; i++) {
                    text = text + selection[i].text + ", ";
                }
                return text;
            }
        });
        this.SingleSelectSelection = ko.computed({
            owner: this,
            read: function () {
                var selection = this.SingleSelectSelected();
                var text = '';
                for (var i = 0; i < selection.length; i++) {
                    text = text + selection[i].text + ", ";
                }
                return text;
            }
        });
        this.SingleSelectDataPassed = ko.computed({
            owner: this,
            read: function () {
                var selection = this.MultiSelectSelected();
                var data = [];
                for (var i = 0; i < selection.length; i++) {
                    data.push({ text: selection[i].text, value: selection[i].value });
                }
                return data;
            }
        });
    }
    return model;
})();
try {
    var model1 = new model();
    ko.applyBindings(model1);
}
catch (ex) {
    alert(ex);
}
//# sourceMappingURL=Index.js.map