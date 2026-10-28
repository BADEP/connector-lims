# Copyright 2026 Dixmit
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).
import odoo

from odoo.addons.web.tests.test_js import WebSuite


@odoo.tests.tagged("post_install", "-at_install")
class TestLimsWebSuite(WebSuite):
    """Test Lims WebSuite"""

    def test_lims(self, modules):
        # WebSuite is a CrossModule test in 20.0: methods receive the tested
        # modules and get_hoot_filters() became _get_hoot_filters()
        self._test_params = [("+", "@lims")]
        self.test_unit_desktop(modules)
