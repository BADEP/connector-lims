// Copyright 2026 Dixmit
// License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).

import {Component, proxy, signal, untrack, useProps} from "@odoo/owl";
import {
  areDatesEqual,
  deserializeDate,
  deserializeDateTime,
  parseDate,
  parseDateTime,
  serializeDate,
  serializeDateTime,
} from "@web/core/l10n/dates";
import {useLayoutEffect} from "@web/owl2/utils";
import {formatDate, formatDateTime, formatFloat} from "@web/views/fields/formatters";

import {CheckBox} from "@web/core/checkbox/checkbox";
import {SelectMenu} from "@web/core/select_menu/select_menu";
import {BadgeTag} from "@web/core/tags_list/badge_tag";
import {TagsList} from "@web/core/tags_list/tags_list";

import {parseFloat} from "@web/views/fields/parsers";
import {registry} from "@web/core/registry";
import {standardFieldProps} from "@web/views/fields/standard_field_props";
import {useDateTimePicker} from "@web/core/datetime/datetime_picker_hook";
import {useInputField} from "@web/views/fields/input_field_hook";
import {useTagNavigation} from "@web/core/record_selectors/tag_navigation_hook";

export class LaboratoryValueField extends Component {
  static template = "lims.LaboratoryValueField";
  static components = {BadgeTag, CheckBox, SelectMenu, TagsList};
  props = useProps(standardFieldProps);
  rootRef = signal.ref();
  numpadDecimalRef = signal.ref();
  textInputRef = signal.ref();
  charInputRef = signal.ref();
  dateInputRef = signal.ref();
  multiselectionInputRef = signal.ref();

  setup() {
    super.setup(...arguments);
    useInputField({
      getValue: () => this.value,
      ref: this.numpadDecimalRef,
      parse: (v) => {
        return {
          ...this.props.record.data[this.props.name],
          value: this.parse(v),
        };
      },
    });
    useInputField({
      getValue: () => this.value,
      ref: this.textInputRef,
      parse: (v) => {
        return {...this.props.record.data[this.props.name], value: v};
      },
    });
    useInputField({
      getValue: () => this.value,
      ref: this.charInputRef,
      parse: (v) => {
        return {...this.props.record.data[this.props.name], value: v};
      },
    });
    if (
      this.props.record.data[this.props.name].result_type === "datetime" ||
      this.props.record.data[this.props.name].result_type === "date"
    ) {
      const getPickerProps = () => {
        var value = this.props.record.data[this.props.name].value;
        if (value && typeof value === "string") {
          if (this.props.record.data[this.props.name].result_type === "date") {
            value = deserializeDate(value);
          } else {
            value = deserializeDateTime(value);
          }
        }
        /** @type {DateTimePickerProps} */
        const pickerProps = {
          value,
          type: this.props.record.data[this.props.name].result_type,
          range: false,
          rounding: 0,
        };
        return pickerProps;
      };
      const dateTimePicker = useDateTimePicker({
        target: this.rootRef,
        showSeconds: true,
        get pickerProps() {
          return getPickerProps();
        },
        onChange: () => {
          this.state.range = false;
        },
        onClose: () => {
          this.picker.activeInput = "";
          this.state.value = deserializeDateTime(
            this.props.record.data[this.props.name].value
          );
        },
        onApply: async () => {
          if (this.props.record.data[this.props.name].result_type === "date") {
            await this.props.record.update({
              [this.props.name]: {
                ...this.props.record.data[this.props.name],
                value: serializeDate(this.state.value),
              },
            });
          } else {
            await this.props.record.update({
              [this.props.name]: {
                ...this.props.record.data[this.props.name],
                value: serializeDateTime(this.state.value),
              },
            });
          }
        },
      });
      this.state = proxy(dateTimePicker.state);
      this.picker = proxy({activeInput: ""});
      this.openPicker = dateTimePicker.open;
      useLayoutEffect(
        () => {
          const el = this.dateInputRef();
          if (el?.getAttribute("data-field") === this.picker.activeInput) {
            el.focus();
            this.openPicker();
          }
        },
        () => [untrack(this.dateInputRef)?.tagName, this.picker.activeInput]
      );
    }
    if (this.type === "multiselection") {
      useTagNavigation(this.multiselectionInputRef, {
        isEnabled: () => !this.props.readonly,
        delete: (index) => this.deleteTagByIndex(index),
      });
    }
  }
  get type() {
    return this.props.record.data[this.props.name].result_type;
  }
  parse(value) {
    if (this.type === "float") {
      return parseFloat(value, {allowOperation: true});
    }
    if (this.type === "text" || this.type === "char") {
      return value.trim();
    }
    if (this.type === "date") {
      return formatDate(value);
    }
    if (this.type === "datetime") {
      return formatDateTime(value);
    }
    return value;
  }
  get value() {
    const data = this.props.record.data[this.props.name];
    if (this.type === "float") {
      return formatFloat(data.value || 0, {digits: [16, data.digits || 0]});
    }
    if (this.type === "boolean") {
      return data.value;
    }

    if (this.type === "date" && data.value) {
      return formatDate(deserializeDate(data.value), {numeric: true});
    }
    if (this.type === "datetime" && data.value) {
      return formatDateTime(deserializeDateTime(data.value), {numeric: true});
    }
    return data.value || "";
  }
  onChangeBoolean(newValue) {
    this.props.record.update({
      [this.props.name]: {
        ...this.props.record.data[this.props.name],
        value: this.parse(newValue),
      },
    });
  }
  triggerDateIsDirty(isDirty) {
    this.props.record.model.bus.trigger(
      "FIELD_IS_DIRTY",
      isDirty ??
        !areDatesEqual(this.props.record.data[this.props.name].value, this.state.value)
    );
  }
  get formattedDate() {
    var formattedValue = false;
    if (this.state.value && this.type === "date") {
      formattedValue = formatDate(this.state.value, {
        numeric: true,
      });
    } else if (this.state.value && this.type === "datetime") {
      formattedValue = formatDateTime(this.state.value, {
        numeric: true,
      });
    }
    return formattedValue;
  }
  onDateInput() {
    this.triggerDateIsDirty(true);
  }
  async onDateChange() {
    const value = this.dateInputRef().value;
    if (!value) {
      this.state.value = null;
      this.triggerDateIsDirty(false);
      return;
    }
    if (this.type === "date") {
      this.state.value = parseDate(value);
      await this.props.record.update({
        [this.props.name]: {
          ...this.props.record.data[this.props.name],
          value: serializeDate(this.state.value),
        },
      });
    } else if (this.type === "datetime") {
      this.state.value = parseDateTime(value);
      await this.props.record.update({
        [this.props.name]: {
          ...this.props.record.data[this.props.name],
          value: serializeDateTime(this.state.value),
        },
      });
    }
  }
  onChangeMultiSelectionCheck(value) {
    this.props.record.update({
      [this.props.name]: {
        ...this.props.record.data[this.props.name],
        value: {
          ...this.props.record.data[this.props.name].value,
          [value]: !this.props.record.data[this.props.name].value?.[value],
        },
      },
    });
  }
  onChangeSelection(value) {
    this.props.record.update({
      [this.props.name]: {
        ...this.props.record.data[this.props.name],
        value: value,
      },
    });
  }
}

export const laboratoryValueField = {
  component: LaboratoryValueField,
  supportedTypes: ["json"],
};

registry.category("fields").add("laboratory_value", laboratoryValueField);
