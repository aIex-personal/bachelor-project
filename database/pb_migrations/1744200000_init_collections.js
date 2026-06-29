/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Initial schema setup for Haptic Pattern Design System
 *
 * PocketBase v0.22+ JS migration notes:
 *
 *  • fields.add(plainObject) fails: goja has no registered converter from a
 *    plain JS object to the core.Field Go interface.
 *
 *  • JSON.stringify(collection) / new Collection(data) approach for updating
 *    existing collections is unreliable because the id getter on the native Go
 *    wrapper is non-enumerable, so the resulting object has no id and save()
 *    fails with "id invalid / name not unique".
 *
 *  WORKING APPROACH for modifying an existing collection:
 *    1. Use new Collection({fields:[...]}) to create an in-memory "field
 *       factory" collection. PocketBase's UnmarshalJSON constructs properly
 *       typed core.Field instances for each entry.
 *    2. Call fields.getByName() on that in-memory collection to obtain the
 *       typed core.Field value.
 *    3. Pass that typed value to existingCol.fields.add(typedField) — this
 *       succeeds because goja is receiving an already-converted Go value.
 *    4. Mutate the other collection properties (rules) directly.
 *    5. app.save(existingCol) — saves the original collection (correct ID).
 */
migrate(function(app) {

    // ----------------------------------------------------------------
    // 1. Extend built-in users auth collection with a `role` field
    //
    //    Create an in-memory "factory" collection just to get a properly
    //    typed SelectField instance, then add it to the real users collection.
    // ----------------------------------------------------------------
    var usersCol = app.findCollectionByNameOrId("users");

    if (!usersCol.fields.getByName("role")) {
        // Build an in-memory-only Collection so PocketBase's UnmarshalJSON
        // creates the proper SelectField Go type for us.
        var fieldFactory = new Collection({
            "id":   "tempfactory01",
            "type": "base",
            "name": "tempfactory01",
            "fields": [{
                "id":          "haptrolef001",
                "type":        "select",
                "name":        "role",
                "required":    true,
                "presentable": false,
                "hidden":      false,
                "system":      false,
                "maxSelect":   1,
                "values":      ["user", "manager", "superadmin"]
            }]
        });

        // Extract the properly-typed core.Field and add it to usersCol
        var roleField = fieldFactory.fields.getByName("role");
        usersCol.fields.add(roleField);
    }

    usersCol.listRule   = '@request.auth.id != ""';
    usersCol.viewRule   = '@request.auth.id != ""';
    usersCol.createRule = "";
    usersCol.updateRule = "@request.auth.id = id";
    usersCol.deleteRule = "@request.auth.id = id";

    app.save(usersCol);

    var usersId = usersCol.id;

    // ----------------------------------------------------------------
    // 2. sounds — personal sounds/presets created by users
    // ----------------------------------------------------------------
    var soundsExists = false;
    try { app.findCollectionByNameOrId("sounds"); soundsExists = true; } catch(e) {}
    if (!soundsExists) {
        app.save(new Collection({
            "id":         "hapticsounds01",
            "name":       "sounds",
            "type":       "base",
            "listRule":   '@request.auth.id != ""',
            "viewRule":   '@request.auth.id != ""',
            "createRule": '@request.auth.id != ""',
            "updateRule": "@request.auth.id = owner",
            "deleteRule": "@request.auth.id = owner",
            "fields": [
                {
                    "autogeneratePattern": "[a-z0-9]{15}",
                    "hidden": false, "id": "sndsysid0001", "max": 0, "min": 0,
                    "name": "id", "pattern": "^[a-z0-9]+$",
                    "presentable": false, "primaryKey": true,
                    "required": true, "system": true, "type": "text"
                },
                { "hidden": false, "id": "sndsyscr0001", "name": "created", "onCreate": true,  "onUpdate": false, "presentable": false, "system": true, "type": "autodate" },
                { "hidden": false, "id": "sndsysup0001", "name": "updated", "onCreate": true,  "onUpdate": true,  "presentable": false, "system": true, "type": "autodate" },
                { "id": "sndname00001",  "type": "text",     "name": "name",          "required": true,  "presentable": true,  "hidden": false, "system": false, "min": null, "max": 100,  "pattern": "" },
                { "id": "sndowner0001",  "type": "relation", "name": "owner",         "required": true,  "presentable": false, "hidden": false, "system": false, "collectionId": usersId, "cascadeDelete": true,  "minSelect": null, "maxSelect": 1 },
                { "id": "sndwavtyp001",  "type": "select",   "name": "wave_type",     "required": true,  "presentable": false, "hidden": false, "system": false, "maxSelect": 1, "values": ["sine", "triangle", "square", "sawtooth"] },
                { "id": "sndfreq00001",  "type": "number",   "name": "frequency",     "required": true,  "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "sndfreqend01",  "type": "number",   "name": "frequency_end", "required": false, "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "sndampl00001",  "type": "number",   "name": "amplitude",     "required": true,  "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "snddur000001",  "type": "number",   "name": "duration",      "required": true,  "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "sndenv000001",  "type": "json",     "name": "envelope",      "required": false, "presentable": false, "hidden": false, "system": false, "maxSize": 0 },
                { "id": "sndtags00001",  "type": "json",     "name": "tags",          "required": false, "presentable": false, "hidden": false, "system": false, "maxSize": 0 },
                { "id": "sndcat000001",  "type": "text",     "name": "category",      "required": false, "presentable": false, "hidden": false, "system": false, "min": null, "max": 50,  "pattern": "" },
                { "id": "sndnotes0001",  "type": "text",     "name": "notes",         "required": false, "presentable": false, "hidden": false, "system": false, "min": null, "max": 500, "pattern": "" },
                { "id": "sndpub000001",  "type": "bool",     "name": "is_public",     "required": false, "presentable": false, "hidden": false, "system": false }
            ]
        }));
    }

    // ----------------------------------------------------------------
    // 3. admin_signals — centralized admin signal library
    // ----------------------------------------------------------------
    var adminSignalsExists = false;
    try { app.findCollectionByNameOrId("admin_signals"); adminSignalsExists = true; } catch(e) {}
    if (!adminSignalsExists) {
        app.save(new Collection({
            "id":         "hapticadmsig01",
            "name":       "admin_signals",
            "type":       "base",
            "listRule":   "@request.auth.role = 'superadmin' || @request.auth.role = 'manager' || (is_globally_accessible = true && @request.auth.id != \"\")",
            "viewRule":   "@request.auth.role = 'superadmin' || @request.auth.role = 'manager' || (is_globally_accessible = true && @request.auth.id != \"\")",
            "createRule": "@request.auth.role = 'superadmin' || @request.auth.role = 'manager'",
            "updateRule": "@request.auth.role = 'superadmin' || @request.auth.role = 'manager'",
            "deleteRule": "@request.auth.role = 'superadmin'",
            "fields": [
                {
                    "autogeneratePattern": "[a-z0-9]{15}",
                    "hidden": false, "id": "sigsysid0001", "max": 0, "min": 0,
                    "name": "id", "pattern": "^[a-z0-9]+$",
                    "presentable": false, "primaryKey": true,
                    "required": true, "system": true, "type": "text"
                },
                { "hidden": false, "id": "sigsyscr0001", "name": "created", "onCreate": true,  "onUpdate": false, "presentable": false, "system": true, "type": "autodate" },
                { "hidden": false, "id": "sigsysup0001", "name": "updated", "onCreate": true,  "onUpdate": true,  "presentable": false, "system": true, "type": "autodate" },
                { "id": "signame00001",  "type": "text",     "name": "name",       "required": true,  "presentable": true,  "hidden": false, "system": false, "min": null, "max": 100,  "pattern": "" },
                { "id": "sigcreator01",  "type": "relation", "name": "created_by", "required": false, "presentable": false, "hidden": false, "system": false, "collectionId": usersId, "cascadeDelete": false, "minSelect": null, "maxSelect": 1 },
                { "id": "sigwavtyp001",  "type": "select",   "name": "wave_type",  "required": true,  "presentable": false, "hidden": false, "system": false, "maxSelect": 1, "values": ["sine", "triangle", "square", "sawtooth"] },
                { "id": "sigfreq00001",  "type": "number",   "name": "frequency",      "required": true,  "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "sigfreqend01",  "type": "number",   "name": "frequency_end",  "required": false, "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "sigampl00001",  "type": "number",   "name": "amplitude",      "required": true,  "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "sigdur000001",  "type": "number",   "name": "duration",       "required": true,  "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "sigenv000001",  "type": "json",     "name": "envelope",       "required": false, "presentable": false, "hidden": false, "system": false, "maxSize": 0 },
                { "id": "sigtags00001",  "type": "json",     "name": "tags",           "required": false, "presentable": false, "hidden": false, "system": false, "maxSize": 0 },
                { "id": "sigcat000001",  "type": "text",     "name": "category",       "required": false, "presentable": false, "hidden": false, "system": false, "min": null, "max": 100,  "pattern": "" },
                { "id": "sigdesc00001",  "type": "text",     "name": "description",    "required": false, "presentable": false, "hidden": false, "system": false, "min": null, "max": 1000, "pattern": "" },
                { "id": "sigglobal001",  "type": "bool",     "name": "is_globally_accessible", "required": false, "presentable": false, "hidden": false, "system": false }
            ]
        }));
    }

    // ----------------------------------------------------------------
    // 4. signal_access — per-user access grants for admin signals
    // ----------------------------------------------------------------
    var signalAccessExists = false;
    try { app.findCollectionByNameOrId("signal_access"); signalAccessExists = true; } catch(e) {}
    if (!signalAccessExists) {
        var adminSignalsCol = app.findCollectionByNameOrId("admin_signals");
        app.save(new Collection({
            "id":         "hapticsigacc01",
            "name":       "signal_access",
            "type":       "base",
            "listRule":   "@request.auth.role = 'superadmin' || @request.auth.role = 'manager' || @request.auth.id = user_id",
            "viewRule":   "@request.auth.role = 'superadmin' || @request.auth.role = 'manager' || @request.auth.id = user_id",
            "createRule": "@request.auth.role = 'superadmin' || @request.auth.role = 'manager'",
            "updateRule": "@request.auth.role = 'superadmin' || @request.auth.role = 'manager'",
            "deleteRule": "@request.auth.role = 'superadmin' || @request.auth.role = 'manager'",
            "fields": [
                {
                    "autogeneratePattern": "[a-z0-9]{15}",
                    "hidden": false, "id": "accsysid0001", "max": 0, "min": 0,
                    "name": "id", "pattern": "^[a-z0-9]+$",
                    "presentable": false, "primaryKey": true,
                    "required": true, "system": true, "type": "text"
                },
                { "hidden": false, "id": "accsyscr0001", "name": "created", "onCreate": true,  "onUpdate": false, "presentable": false, "system": true, "type": "autodate" },
                { "hidden": false, "id": "accsysup0001", "name": "updated", "onCreate": true,  "onUpdate": true,  "presentable": false, "system": true, "type": "autodate" },
                { "id": "accsignal001",  "type": "relation", "name": "signal_id",  "required": true,  "presentable": false, "hidden": false, "system": false, "collectionId": adminSignalsCol.id, "cascadeDelete": true,  "minSelect": null, "maxSelect": 1 },
                { "id": "accuser00001",  "type": "relation", "name": "user_id",    "required": true,  "presentable": false, "hidden": false, "system": false, "collectionId": usersId,            "cascadeDelete": true,  "minSelect": null, "maxSelect": 1 },
                { "id": "accgranted01",  "type": "relation", "name": "granted_by", "required": false, "presentable": false, "hidden": false, "system": false, "collectionId": usersId,            "cascadeDelete": false, "minSelect": null, "maxSelect": 1 }
            ]
        }));
    }

    // ----------------------------------------------------------------
    // 5. projects — user haptic composition projects
    // ----------------------------------------------------------------
    var projectsExists = false;
    try { app.findCollectionByNameOrId("projects"); projectsExists = true; } catch(e) {}
    if (!projectsExists) {
        app.save(new Collection({
            "id":         "hapticproject1",
            "name":       "projects",
            "type":       "base",
            "listRule":   "@request.auth.id = owner",
            "viewRule":   "@request.auth.id = owner",
            "createRule": '@request.auth.id != ""',
            "updateRule": "@request.auth.id = owner",
            "deleteRule": "@request.auth.id = owner",
            "fields": [
                {
                    "autogeneratePattern": "[a-z0-9]{15}",
                    "hidden": false, "id": "prjsysid0001", "max": 0, "min": 0,
                    "name": "id", "pattern": "^[a-z0-9]+$",
                    "presentable": false, "primaryKey": true,
                    "required": true, "system": true, "type": "text"
                },
                { "hidden": false, "id": "prjsyscr0001", "name": "created", "onCreate": true,  "onUpdate": false, "presentable": false, "system": true, "type": "autodate" },
                { "hidden": false, "id": "prjsysup0001", "name": "updated", "onCreate": true,  "onUpdate": true,  "presentable": false, "system": true, "type": "autodate" },
                { "id": "prjname00001",  "type": "text",     "name": "name",           "required": true,  "presentable": true,  "hidden": false, "system": false, "min": null, "max": 100,  "pattern": "" },
                { "id": "prjowner0001",  "type": "relation", "name": "owner",          "required": true,  "presentable": false, "hidden": false, "system": false, "collectionId": usersId, "cascadeDelete": true, "minSelect": null, "maxSelect": 1 },
                { "id": "prjtracks001",  "type": "json",     "name": "tracks",         "required": false, "presentable": false, "hidden": false, "system": false, "maxSize": 0 },
                { "id": "prjtotdur01",   "type": "number",   "name": "total_duration", "required": false, "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "prjdesc00001",  "type": "text",     "name": "description",    "required": false, "presentable": false, "hidden": false, "system": false, "min": null, "max": 500, "pattern": "" },
                { "id": "prjbpm000001",  "type": "number",   "name": "bpm",            "required": false, "presentable": false, "hidden": false, "system": false, "onlyInt": true,  "min": null, "max": null }
            ]
        }));
    }

    // ----------------------------------------------------------------
    // 6. patterns — reusable haptic patterns
    // ----------------------------------------------------------------
    var patternsExists = false;
    try { app.findCollectionByNameOrId("patterns"); patternsExists = true; } catch(e) {}
    if (!patternsExists) {
        app.save(new Collection({
            "id":         "hapticpattern1",
            "name":       "patterns",
            "type":       "base",
            "listRule":   "@request.auth.id = owner",
            "viewRule":   "@request.auth.id = owner",
            "createRule": '@request.auth.id != ""',
            "updateRule": "@request.auth.id = owner",
            "deleteRule": "@request.auth.id = owner",
            "fields": [
                {
                    "autogeneratePattern": "[a-z0-9]{15}",
                    "hidden": false, "id": "patsysid0001", "max": 0, "min": 0,
                    "name": "id", "pattern": "^[a-z0-9]+$",
                    "presentable": false, "primaryKey": true,
                    "required": true, "system": true, "type": "text"
                },
                { "hidden": false, "id": "patsyscr0001", "name": "created", "onCreate": true,  "onUpdate": false, "presentable": false, "system": true, "type": "autodate" },
                { "hidden": false, "id": "patsysup0001", "name": "updated", "onCreate": true,  "onUpdate": true,  "presentable": false, "system": true, "type": "autodate" },
                { "id": "patname00001",  "type": "text",     "name": "name",        "required": true,  "presentable": true,  "hidden": false, "system": false, "min": null, "max": 100,  "pattern": "" },
                { "id": "patowner0001",  "type": "relation", "name": "owner",       "required": true,  "presentable": false, "hidden": false, "system": false, "collectionId": usersId, "cascadeDelete": true, "minSelect": null, "maxSelect": 1 },
                { "id": "patblocks001",  "type": "json",     "name": "blocks",      "required": false, "presentable": false, "hidden": false, "system": false, "maxSize": 0 },
                { "id": "patdur000001",  "type": "number",   "name": "duration",    "required": false, "presentable": false, "hidden": false, "system": false, "onlyInt": false, "min": null, "max": null },
                { "id": "patdesc00001",  "type": "text",     "name": "description", "required": false, "presentable": false, "hidden": false, "system": false, "min": null, "max": 500, "pattern": "" }
            ]
        }));
    }

}, function(app) {
    // ----------------------------------------------------------------
    // Rollback: delete custom collections; remove role field from users
    // ----------------------------------------------------------------
    var toDelete = ["patterns", "projects", "signal_access", "admin_signals", "sounds"];
    for (var i = 0; i < toDelete.length; i++) {
        try { app.delete(app.findCollectionByNameOrId(toDelete[i])); } catch(e) {}
    }

    try {
        var usersCol  = app.findCollectionByNameOrId("users");
        var roleField = usersCol.fields.getByName("role");
        if (roleField) {
            usersCol.fields.removeById(roleField.id);
            app.save(usersCol);
        }
    } catch(e) {}
});
