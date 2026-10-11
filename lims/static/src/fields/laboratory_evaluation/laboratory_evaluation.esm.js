// Copyright 2026 Dixmit
// License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).

import {Component, useProps} from "@odoo/owl";
import {registry} from "@web/core/registry";
import {standardFieldProps} from "@web/views/fields/standard_field_props";

export class LaboratoryEvaluationField extends Component {
  static template = "lims.LaboratoryEvaluationField";
  props = useProps(standardFieldProps);

  get value() {
    return this.props.record.data[this.props.name];
  }
}
export const laboratoryEvaluationField = {
  component: LaboratoryEvaluationField,
  supportedTypes: ["selection"],
};

registry.category("fields").add("laboratory_evaluation", laboratoryEvaluationField);
