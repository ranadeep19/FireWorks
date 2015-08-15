/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/*
'multi-select-with-auto-complete' is an user control which can be used when a drop down list having checkboxes is required having an auto-complete search textbox. It supports single selection and All selection as well.

Following are the parameters which can be passed to this control:
---dataPassed:Use when a list of data needs to be displayed in this control. This parameter can accept an KnockoutObservableArray<any> or hardcoded list where each element must have a 'text' and 'value' property.
        e.g: [{text:'aa',value:'aa1'},{text:'bb',value:'bb1'},{text:'cc',value:'cc1'}]

---selected: Use when need to retrieve the selected checkboxes from control. This has to be a KnockoutObservableArray<any> where each element will have a 'text' and 'value' property.
        e.g: [{text:'aa',value:'aa1'},{text:'bb',value:'bb1'},{text:'cc',value:'cc1'}]

---selectSingle: Use when only one checkbox needs to be selected. This parameter accepts boolean.

---addAllOption: Use when an 'All' option needs to be added at the top of all the checkboxes and on selection all checkboxes will be checked. This parameter accepts boolean.

---defaultSelection: Use when by default checkboxes should be selected during intial load. This accepts a string with comma separated values. If all checkboxes should be selected , then send value 'All', else send 'value' part of the checkbox items which needs to be selected.
   
---dataBindCount: Use when you want to change how many records will be shown in the drop down at one point of time. By default the value is 100. Please do not set to high value to avoid drop down performance.

Note:
1. 'selectSingle' and 'addAllOption' can not be true at the same time
2. Data returned from ajax call should be a list where each element must have a 'text' and 'value' property
3. When 'defaultSelection' is an observable and will change based on events; to notfiy the same to the control re-populate data using observable 'dataPassed'

Examples:

<multi-select-with-auto-complete id="partNumber"
    params="dataPassed  :[{text:'aa',value:'aa1'},{text:'bb',value:'bb1'},{text:'cc',value:'cc1'}],
    addAllOption     :true,
    selected            :ManageCustomerModel.selectedPartNumbers,
    defaultSelection    :'aa1,bb1'"
style="height:auto;max-height:400px;width:300px"></multi-select-with-auto-complete>

<multi-select-with-auto-complete id="partNumber"
    params="dataPassed  :[{text:'aa',value:'aa1'},{text:'bb',value:'bb1'},{text:'cc',value:'cc1'}],
    selected            :ManageCustomerModel.selectedPartNumbers,
    selectSingle        :true,
    defaultSelection    :'aa1'"
style="height:auto;max-height:100px;width:100px"></multi-select-with-auto-complete>
        
*/
var MultiSelectDropDownWithAutoCompleteViewModel = (function () {
    function MultiSelectDropDownWithAutoCompleteViewModel(params) {
        this.selectSingle = params.selectSingle;
        this.addAllOption = params.addAllOption;
        this.selectedCheckBoxes = params.selected;
        this.defaultSelection = params.defaultSelection == undefined ? '' : params.defaultSelection;
        this.dataBindCount = params.dataBindCount == undefined ? 100 : params.dataBindCount;
        this.data = [];
        this.mappedData = [];
        this.formattedSelectedCheckBoxes = ko.observable();
        this.searchString = ko.observable('');
        this._selectedCheckBoxes = [];
        this.parentControlId = ko.observable('');
        this.CheckBoxChecked = this.CheckBoxChecked.bind(this);
        this.CheckUncheckAllOption = this.CheckUncheckAllOption.bind(this);
        this.BindData = this.BindData.bind(this);
        this.dropDownClick = this.dropDownClick.bind(this);
        this.CheckUncheckBindedData = this.CheckUncheckBindedData.bind(this);
        this.OkClick = this.OkClick.bind(this);
        this.CancelClick = this.CancelClick.bind(this);
        this.UpdatePageWithSelection = this.UpdatePageWithSelection.bind(this);
        this.BindNextSetOfData = this.BindNextSetOfData.bind(this);
        this.BindPrevSetOfData = this.BindPrevSetOfData.bind(this);
        this.scrolled = this.scrolled.bind(this);
        this.resetScroll = this.resetScroll.bind(this);
        ko.computed({
            owner: this,
            read: function () {
                if (jQuery.isFunction(params.dataPassed))
                    this.BindData(params.dataPassed());
                else
                    this.BindData(params.dataPassed);
            }
        });
        this.toolTip = ko.pureComputed({
            owner: this,
            read: function () {
                var text = this.formattedSelectedCheckBoxes();
                if (text != undefined && text.length > 500)
                    return text.slice(0, 500) + "...";
                else
                    return text;
            }
        });
        //Actual binding of data to the drop down happens in the below pureComputed method.
        ko.computed({
            owner: this,
            read: function () {
                var searchString = this.searchString();
                this.currentStartCount = 0;
                this.currentEndCount = 0;
                if (searchString.charCodeAt(0) == 160)
                    searchString = " " + searchString.slice(1);
                var ul = $("multi-select-with-auto-complete[id ='" + this.parentControlId() + "']").find("ul");
                $(ul).html('');
                $(ul).scrollTop(0);
                this.BindNextSetOfData(this.dataBindCount, searchString);
            }
        }).extend({ rateLimit: { method: "notifyWhenChangesStop", timeout: 400 } });
        if (this.selectSingle == true && this.addAllOption == true)
            throw "SelectSingle and addAllOption can not be true at the same time";
    }
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.BindNextSetOfData = function (count, searchString) {
        if (searchString === void 0) { searchString = ''; }
        var lis = '';
        var _tempCount = 0;
        var i = this.currentEndCount;
        var extra = 1;
        if (this.addAllOption == true && searchString == "" && this.data.length > 0 && i <= 0) {
            lis += '  <li class="k-item" >' + '<input type="checkbox" value="' + this.data[0].value + ((this.data[0].checked == true) ? '" checked' : '" ') + '/>' + '<span>' + this.data[0].text + '</span></li>';
            _tempCount++;
            i++;
        }
        for (i; i < this.data.length && _tempCount < count + extra; i++) {
            if (this.data[i].text.toLowerCase().indexOf(searchString.toLowerCase()) > -1 && this.data[i].text != "All") {
                lis += '  <li class="k-item" >' + '<input type="checkbox" value="' + this.data[i].value + ((this.data[i].checked == true) ? '" checked' : '" ') + '/>' + '<span>' + this.data[i].text + '</span></li>';
                _tempCount++;
            }
        }
        if (_tempCount == count + extra)
            i -= extra;
        //Once it reaches end and still _tempCount has not reached count, then to equal count, move back from currentEndCount till _tempCount reaches count
        if (_tempCount < count + extra) {
            for (var j = this.currentEndCount - 1; j >= 0 && _tempCount < count + extra; j--) {
                if (this.data[j].text.toLowerCase().indexOf(searchString.toLowerCase()) > -1 && this.data[j].text != "All") {
                    lis = '  <li class="k-item" >' + '<input type="checkbox" value="' + this.data[j].value + ((this.data[j].checked == true) ? '" checked' : '" ') + '/>' + '<span>' + this.data[j].text + '</span></li>' + lis;
                    _tempCount++;
                    this.currentEndCount = (_tempCount == (count + extra)) ? (j + extra) : j;
                }
            }
        }
        var ul = $("multi-select-with-auto-complete[id ='" + this.parentControlId() + "']").find("ul")[0];
        if (ul != undefined && lis != '') {
            $(ul).html(lis);
        }
        if (_tempCount == 0)
            return false;
        this.currentStartCount = this.currentEndCount;
        this.currentEndCount = i;
        if (this.currentEndCount >= this.data.length) {
            this.currentStartCount -= extra;
            return false;
        }
        return true;
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.BindPrevSetOfData = function (count, searchString) {
        if (searchString === void 0) { searchString = ''; }
        var lis = '';
        var _tempCount = 0;
        var extra = 1;
        var i = this.currentStartCount + extra;
        var j = this.currentStartCount + extra;
        if (i <= 0)
            return false;
        for (--i; i >= 0 && _tempCount < count + extra; i--) {
            if (this.data[i].text.toLowerCase().indexOf(searchString.toLowerCase()) > -1 && this.data[i].text != "All") {
                lis = '  <li class="k-item" >' + '<input type="checkbox" value="' + this.data[i].value + ((this.data[i].checked == true) ? '" checked' : '" ') + '/>' + '<span>' + this.data[i].text + '</span></li>' + lis;
                _tempCount++;
            }
        }
        if (this.addAllOption == true && searchString == "" && this.data.length > 0 && i <= 0) {
            lis = '  <li class="k-item" >' + '<input type="checkbox" value="' + this.data[0].value + ((this.data[0].checked == true) ? '" checked' : '" ') + '/>' + '<span>' + this.data[0].text + '</span></li>' + lis;
            _tempCount++;
        }
        //Once it reaches start and still _tempCount has not reached count, then to equal count, move forward from currentStartCount till _tempCount reaches count
        if (_tempCount < count + extra) {
            for (j; j < this.data.length && _tempCount < count + extra; j++) {
                if (this.data[j].text.toLowerCase().indexOf(searchString.toLowerCase()) > -1 && this.data[j].text != "All") {
                    lis += '  <li class="k-item" >' + '<input type="checkbox" value="' + this.data[j].value + ((this.data[j].checked == true) ? '" checked' : '" ') + '/>' + '<span>' + this.data[j].text + '</span></li>';
                    _tempCount++;
                }
            }
        }
        var ul = $("multi-select-with-auto-complete[id ='" + this.parentControlId() + "']").find("ul")[0];
        if (ul != undefined && lis != '') {
            $(ul).html(lis);
        }
        if (_tempCount == 0)
            return false;
        this.currentEndCount = this.currentStartCount + (j - this.currentStartCount - extra);
        this.currentStartCount = i + 1;
        if (this.currentStartCount <= 0)
            return false;
        return true;
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.CheckUncheckAllOption = function (target) {
        if ($(target).val() == 'All') {
            var checked = $(target).is(':checked');
            $(target).closest("ul").find("[type=checkbox]").prop('checked', checked);
            for (var i = 0; i < this.data.length; i++) {
                this.data[i].checked = checked;
            }
        }
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.CheckUncheckBindedData = function (value, checked) {
        var index = jQuery.inArray(value, this.mappedData);
        if (index > -1) {
            this.data[index].checked = checked;
        }
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.CheckBoxChecked = function (data, event) {
        if (event.target.type != "checkbox")
            return;
        if (!(event.charCode == 32) && event.type == "keypress")
            return;
        var checked = $(event.target).is(':checked');
        var value = $(event.target).val();
        this.CheckUncheckBindedData(value, checked);
        if (value == 'All')
            this.CheckUncheckAllOption(event.target);
        else if (checked) {
            if (this.selectSingle == true) {
                this.CheckUncheckBindedData($.map(this.data, function (item) {
                    return item.checked == true && item.value != value ? item.value : null;
                })[0], false);
                $(event.target).closest("ul").find("[type=checkbox]:checked").prop('checked', false);
                $(event.target).prop('checked', true);
            }
            else if (this.addAllOption) {
                if ($.map(this.data, function (item) {
                    return item.checked == true ? item.checked : null;
                }).length == this.data.length - 1) {
                    $(event.target).closest("ul").find("[type=checkbox][value='All']").prop('checked', true);
                    this.data[0].checked = true;
                }
            }
        }
        else {
            if (this.addAllOption) {
                $(event.target).closest("ul").find("[type=checkbox][value='All']").prop('checked', false);
                this.data[0].checked = false;
            }
        }
        return true;
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.BindData = function (newData) {
        if (newData != undefined) {
            this.data = [];
            var checked = ko.utils.unwrapObservable(this.defaultSelection) == 'All' ? true : false;
            if (this.addAllOption == true && newData.length > 0) {
                this.data.unshift({ text: 'All', value: 'All', checked: checked });
            }
            for (var i = 0; i < newData.length; i++)
                this.data.push({ text: newData[i].text, value: newData[i].value, checked: (ko.utils.unwrapObservable(this.defaultSelection).toString().indexOf(newData[i].value) > -1 ? true : checked) });
            this.mappedData = $.map(this.data, function (item) {
                return item.value.toString();
            });
            this.searchString(" ");
            this.searchString("");
            this.UpdatePageWithSelection(false);
        }
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.scrolled = function (data, event) {
        var elem = event.target;
        if ((elem.scrollTop + elem.offsetHeight) > elem.scrollHeight) {
            var isDataPresent = this.BindNextSetOfData(this.dataBindCount, this.searchString());
            if (isDataPresent == true)
                elem.scrollTop = 5;
        }
        else if ((elem.scrollTop) <= 0) {
            var isDataPresent = this.BindPrevSetOfData(this.dataBindCount, this.searchString());
            if (isDataPresent == true)
                elem.scrollTop = (elem.scrollHeight - elem.offsetHeight) - 5;
        }
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.resetScroll = function () {
        this.currentStartCount = 0;
        this.currentEndCount = 0;
        this.BindNextSetOfData(this.dataBindCount, this.searchString());
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.dropDownClick = function (data, event) {
        if (!(event.charCode == 13 || event.charCode == 32) && event.type == "keypress")
            return;
        var grid_div = $(event.target).closest("multi-select-with-auto-complete").find("[id='multi_select_grid_div']");
        var select_div = $(grid_div).closest("multi-select-with-auto-complete").find("[id='multi_select_selected_div']");
        if ($(grid_div).is(':visible'))
            $(select_div).focus();
        else
            $(grid_div).focus();
        var self = this;
        setTimeout(function () {
            $(grid_div).slideToggle();
            if ($(grid_div).css("display") === "block") {
                self.resetScroll();
            }
        }, 1);
        $(select_div).unbind('focusout');
        $(select_div).bind('focusout', function () {
            var focus = $(':focus');
            if (focus.length == 0)
                focus = $(this);
            if (focus.closest("multi-select-with-auto-complete").find(this).length == 0 && $(grid_div).is(':visible') == true && $(grid_div).css("z-index") != "1") {
                setTimeout(function () {
                    $(grid_div).slideToggle();
                    if ($(grid_div).css("display") === "block")
                        self.resetScroll();
                }, 1);
            }
        });
        $(grid_div).unbind('focusout');
        $(grid_div).bind('focusout', function () {
            var focus = $(':focus');
            if (focus.length == 0)
                focus = $(this);
            if (focus.closest("multi-select-with-auto-complete").find(this).length == 0 && $(grid_div).is(':visible') == true && $(grid_div).css("z-index") != "1") {
                setTimeout(function () {
                    $(grid_div).slideToggle();
                    if ($(grid_div).css("display") === "block")
                        self.resetScroll();
                }, 1);
            }
        });
        return true;
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.UpdatePageWithSelection = function (fireStatusChanged, event) {
        if (event === void 0) { event = null; }
        var array = [];
        var arrayText = [];
        var i = this.addAllOption == true ? 1 : 0;
        for (i; i < this.data.length; i++) {
            if (this.data[i].checked == true) {
                array.push({ text: this.data[i].text, value: this.data[i].value });
                arrayText.push(this.data[i].text);
            }
        }
        if (this.addAllOption == true && this.data.length > 0 && array.length == this.data.length - 1) {
            arrayText.splice(0);
            arrayText.push('All');
        }
        var text = arrayText.join('; ');
        if (text != undefined && text.length > 500)
            text = text.slice(0, 500) + "...";
        this.formattedSelectedCheckBoxes(text);
        this.selectedCheckBoxes(array);
        this._selectedCheckBoxes = array;
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.OkClick = function (data, event) {
        var grid_div = $(event.target).closest("multi-select-with-auto-complete").find("[id='multi_select_grid_div']");
        var select_div = $(grid_div).closest("multi-select-with-auto-complete").find("[id='multi_select_selected_div']");
        $(select_div).focus();
        setTimeout(function () {
            $(grid_div).slideToggle();
        }, 1);
        this.searchString("");
        this.UpdatePageWithSelection(true, event);
    };
    MultiSelectDropDownWithAutoCompleteViewModel.prototype.CancelClick = function (data, event) {
        var multi_select = $(event.target).closest("multi-select-with-auto-complete");
        var select_div = $(event.target).closest("multi-select-with-auto-complete").find("[id='multi_select_selected_div']");
        var grid_div = $(multi_select).find("[id='multi_select_grid_div']");
        var checked = false;
        if (this.addAllOption === true && this.formattedSelectedCheckBoxes() === 'All')
            checked = true;
        for (var i = 0; i < this.data.length; i++)
            this.data[i].checked = checked;
        //this is to handle lot of check uncheck scenario: drop down should be closed immediately instead of sliding
        if (checked == false && this._selectedCheckBoxes.length > 3000) {
            $(grid_div).css("display", "none");
        }
        else {
            $(grid_div).slideToggle();
        }
        if (checked == false) {
            var self = this;
            setTimeout(function () {
                for (var i = 0; i < self._selectedCheckBoxes.length; i++)
                    self.CheckUncheckBindedData(self._selectedCheckBoxes[i], true);
            }, 1);
        }
        $(select_div).focus();
        this.searchString(" "); //This is done so as to rebind the dropdown with the previous changes
        this.searchString("");
    };
    return MultiSelectDropDownWithAutoCompleteViewModel;
})();
ko.components.register('multi-select-with-auto-complete', {
    viewModel: MultiSelectDropDownWithAutoCompleteViewModel,
    template: ' <div class="multiSelectDefaultDimensions" data-bind="parentControlID :parentControlId">\
       <div id="multi_select_selected_div" tabindex="0"class="multiSelect-border" data-bind="event:{keyup:dropDownClick},click:dropDownClick" >\
        <span id="selected_data" class="multiSelect-input" data-bind="text:formattedSelectedCheckBoxes,toolTip:toolTip"></span>\
        <span class="multiSelect-arrow"></span>\
        </div>\
        <div id="multi_select_grid_div" class="multiSelect-border multiSelectDefaultDimensions multiSelect-popup" >\
        <div class="multiSelectDefaultDimensions multiSelect-popup-next"  >\
        <div id= "searchText" data-bind="divEditableText: searchString" contenteditable="true" class="multiSelect-border multiSelect-text"/>\
        <ul class="multiSelect-border multiSelect-list multiSelectDefaultDimensions multiSelectDropDownDimensions" data-bind="event:{keypress:CheckBoxChecked, scroll:scrolled},click:CheckBoxChecked">\
</ul>\
    <div ">\
    <input type="button" class="multiSelect-button" value="Cancel" data-bind="click:CancelClick" />\
    <input type="button" class="multiSelect-button" value="Ok" data-bind="click:OkClick" />\
    </div>\
  </div></div>\
 </div>\
     '
});
//# sourceMappingURL=ucMultiSelectDropDownWithAutoComplete.js.map