/// <reference path="knockout.d.ts" />

interface KnockoutBindingHandlers {
    toolTip: KnockoutBindingHandler;
    divEditableText: KnockoutBindingHandler;
    parentControlID: KnockoutBindingHandler;
}

function AddToolTip(element, value) {
    if (jQuery.isFunction(value()) == true)
        $(element).prop("title", value()());
    else
        $(element).prop("title", value());
    //$(element).tooltip();
}

ko.bindingHandlers.toolTip = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        AddToolTip(element, valueAccessor);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        AddToolTip(element, valueAccessor);
    }
};

ko.bindingHandlers.parentControlID = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var observable = valueAccessor();
        if (jQuery.isFunction(observable))
            observable($(element).parent()[0].id);
        else
            observable = $(element).parent()[0].id;
    }
};

ko.bindingHandlers.divEditableText = {
    init: function (element, valueAccessor) {

        $(element).on('keydown', function (e) {
            if (e.keyCode == 13)
                return false;
            return true;
        })
        $(element).on('keyup', function (e) {

            var observable = valueAccessor();
            if (jQuery.isFunction(observable))
                observable($(this).text());
        });
    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).text(value);
    }
};