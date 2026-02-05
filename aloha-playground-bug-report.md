# Bug Report: Aloha Course Playground WORKING copy

## Critical Bugs

### 1. ModuleId: Off-by-one index error

**Node:** `ModuleId`
**Impact:** Sections are placed into the wrong Canvas modules. The last module's sections cause an out-of-bounds crash.

`moduleNumber` is 1-based (JSON schema: `"minimum": 1`), but it is used directly as a 0-based array index:

```js
// BUG:
const idx = moduleNumber;
const targetModule = orderedModules[idx];
```

Module 1 accesses `orderedModules[1]` (the second module), and the last module index exceeds the array length.

**Fix:**
```js
const idx = moduleNumber - 1;
const targetModule = orderedModules[idx];
```

---

### 2. Create Se page: Always uses first section's title

**Node:** `Create Se page`
**Field:** `wiki_page[title]`
**Impact:** Every section page is created with the first section's title instead of its own title.

```
// BUG:
={{ $('Parse Sections').first().json.sectionTitle }}
```

`$('Parse Sections').first()` always returns the first item Parse Sections ever output, not the current iteration item.

**Fix:**
```
={{ $('Iterate Sections').first().json.sectionTitle }}
```

---

### 3. Format CO as HTML: References wrong upload step for audio file ID

**Node:** `Format CO as HTML`
**Impact:** The audio player embed in the Course Overview page points to a non-existent or incorrect file ID.

The audio embed URL references:
```
$('Upload CO audio step 2').item.json.id
```

Canvas file upload step 2 returns a redirect response, not the final file metadata. The actual file `id` is only available after step 3. The `Format HP as HTML` node correctly uses `$('Purge Binary').item.json.id`.

**Fix:** In the Format CO as HTML prompt, replace both occurrences of:
```
$('Upload CO audio step 2').item.json.id
```
with:
```
$('Purge Binary').item.json.id
```

---

## High-Severity Bugs

### 4. Upload Se audio step 1: Filename is a bare numeric ID

**Node:** `Upload Se audio step 1`
**Field:** `name` = `={{ $json.id }}`
**Impact:** Audio files uploaded with numeric IDs as filenames, no extension. Canvas may not recognize the MIME type; files are unidentifiable in the file manager.

**Fix:**
```
=Section_{{ $('Iterate Sections').first().json.sectionNumber }}_Audio_Overview.mp3
```

---

### 5. Upload MO audio step 1: Missing file extension

**Node:** `Upload MO audio step 1`
**Field:** `name` = `=Module_{{ ... }}_Audio_Overview`
**Impact:** Module audio files uploaded without `.mp3` extension.

**Fix:**
```
=Module_{{ $('Loop Over Items').item.json.moduleNumber }}_Audio_Overview.mp3
```

---

### 6. Convert to HTML2: Invalid filename path

**Node:** `Convert to HTML2`
**Field:** `fileName`
**Impact:** HTML file created with `undefined` as filename.

```
// BUG - this path does not exist in the output:
={{ $('Format Se as HTML').item.json.Parse_Sections_output[0].content[0].text.modules[0].sections[0].sectionTitle }}
```

**Fix:**
```
={{ $('Iterate Sections').first().json.sectionTitle }}
```

---

## Medium-Severity Bugs

### 7. Inconsistent Canvas course ID field names

**Impact:** If `.id` and `.CanvasCourseId` are different fields, API calls target the wrong course.

| Node | Field Used |
|------|-----------|
| Upload CO audio step 1 | `.CanvasCourseId` |
| Upload MO audio step 1 | `.CanvasCourseId` |
| Upload Se audio step 1 | `.CanvasCourseId` |
| Upload MO image step 1 | `.id` |
| Upload CO image step 1 gem | `.id` |
| Upload Se image step 1 gem | `.id` |
| Publish Canvas Course | `.id` |

**Fix:** Audit `create_course_folders_navigation` sub-workflow output. Use one canonical field consistently.

---

### 8. Code in JavaScript7 / JavaScript8: Invalid multi-input pattern

**Nodes:** `Code in JavaScript7`, `Code in JavaScript8`
**Impact:** These nodes attempt to access two separate inputs, but Code nodes only have a single input.

```js
// BUG - Code nodes don't support input indices:
const uploadData = $input.all(0);
const originalData = $input.all(1);
```

**Fix:** Either convert to Merge nodes, or restructure to distinguish items from the combined input:
```js
const allItems = $input.all();
const uploadData = allItems.filter(i => i.json.id && !i.json.paragraphLocator);
const originalData = allItems.filter(i => i.json.paragraphLocator);
```

---

### 9. Parse Gemini Output1: No error handling

**Node:** `Parse Gemini Output1`
**Impact:** Any formatting issue in Gemini's section response causes a cryptic JSON parse error.

```js
// BUG - no defensive parsing:
return JSON.parse($json.candidates[0].content.parts[0].text);
```

**Fix:** Apply the same defensive parsing logic used in `Parse Gemini Output` (strip code fences, remove trailing commas, remove control characters, provide context on parse errors).

---

## Low-Severity / Cascade Issues

### 10. Se Page into Module inherits wrong title (cascade from Bug #2)

Because `Create Se page` always creates pages with the first section's title, `Se Page into Module` also places items with the wrong title. Fixing Bug #2 resolves this.

### 11. Image upload step 3 response format inconsistency

`Upload MO image step 3`, `Upload CO image step 3 gem`, and `Upload Se image step 3 gem` set `responseFormat: "file"` (returns binary), while audio step 3 nodes do not. This is likely intentional but should be verified -- returning binary from image uploads could interfere with downstream Code nodes that expect JSON fields.
