**Problem**

* Recent change set `label-width="0"` on the config form, which caused titles (labels) to disappear.

**Plan**

* Revert the `label-width` change and explicitly set `label-align="top"` on the config `t-form` to stack labels above controls without hiding them.

* Keep the added CSS that makes labels block-level and wrap long text; ensure labels remain visible.

**Verification**

* Open the plugin config dialog: labels should render above controls, long titles should wrap, and inputs keep full width.

