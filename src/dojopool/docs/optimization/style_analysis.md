# CSS/SCSS Style Analysis

## tournaments.scss

**File:** `src\dojopool\frontend\styles\tournaments.scss`

**Statistics:**

- Total Rules: 27
- Unique Selectors: 27
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## venues.scss

**File:** `src\dojopool\frontend\styles\venues.scss`

**Statistics:**

- Total Rules: 47
- Unique Selectors: 37
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.ant-card` defined in:
  - src\dojopool\frontend\styles\venues.scss:6
  - src\dojopool\frontend\styles\venues.scss:64
- `.ant-tag` defined in:
  - src\dojopool\frontend\styles\venues.scss:46
  - src\dojopool\frontend\styles\venues.scss:266
- `}
  }
  }

  .ant-modal` defined in:
  - src\dojopool\frontend\styles\venues.scss:105
  - src\dojopool\frontend\styles\venues.scss:326

- `&-title` defined in:
  - src\dojopool\frontend\styles\venues.scss:138
  - src\dojopool\frontend\styles\venues.scss:221
  - src\dojopool\frontend\styles\venues.scss:425
- `&-content` defined in:
  - src\dojopool\frontend\styles\venues.scss:143
  - src\dojopool\frontend\styles\venues.scss:226
  - src\dojopool\frontend\styles\venues.scss:430
- `.ant-table-row` defined in:
  - src\dojopool\frontend\styles\venues.scss:161
  - src\dojopool\frontend\styles\venues.scss:259
  - src\dojopool\frontend\styles\venues.scss:318
- `}
  }

  .ant-table` defined in:
  - src\dojopool\frontend\styles\venues.scss:251
  - src\dojopool\frontend\styles\venues.scss:310

**Optimization Suggestions:**

- Found 7 duplicate selectors
- Consider using CSS variables for consistent values

---

## main.scss

**File:** `src\dojopool\static\scss\main.scss`

**Statistics:**

- Total Rules: 0
- Unique Selectors: 0
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_mixins.scss

**File:** `src\dojopool\static\scss\abstracts\_mixins.scss`

**Statistics:**

- Total Rules: 42
- Unique Selectors: 32
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `@else` defined in:
  - src\dojopool\static\scss\abstracts_mixins.scss:6
  - src\dojopool\static\scss\abstracts_mixins.scss:16
  - src\dojopool\static\scss\abstracts_mixins.scss:24
  - src\dojopool\static\scss\abstracts_mixins.scss:35
  - src\dojopool\static\scss\abstracts_mixins.scss:49
  - src\dojopool\static\scss\abstracts_mixins.scss:100
  - src\dojopool\static\scss\abstracts_mixins.scss:128
  - src\dojopool\static\scss\abstracts_mixins.scss:137
- `. Available sizes are: #` defined in:
  - src\dojopool\static\scss\abstracts_mixins.scss:17
  - src\dojopool\static\scss\abstracts_mixins.scss:50
  - src\dojopool\static\scss\abstracts_mixins.scss:129
  - src\dojopool\static\scss\abstracts_mixins.scss:138

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_variables.scss

**File:** `src\dojopool\static\scss\abstracts\_variables.scss`

**Statistics:**

- Total Rules: 0
- Unique Selectors: 0
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_accessibility.scss

**File:** `src\dojopool\static\scss\base\_accessibility.scss`

**Statistics:**

- Total Rules: 24
- Unique Selectors: 24
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_aria-patterns.scss

**File:** `src\dojopool\static\scss\base\_aria-patterns.scss`

**Statistics:**

- Total Rules: 28
- Unique Selectors: 26
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `&:hover:not([aria-selected='true'])` defined in:
  - src\dojopool\static\scss\base_aria-patterns.scss:19
  - src\dojopool\static\scss\base_aria-patterns.scss:114
- `to` defined in:
  - src\dojopool\static\scss\base_aria-patterns.scss:257
  - src\dojopool\static\scss\base_aria-patterns.scss:267

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_reset.scss

**File:** `src\dojopool\static\scss\base\_reset.scss`

**Statistics:**

- Total Rules: 29
- Unique Selectors: 29
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_alerts.scss

**File:** `src\dojopool\static\scss\components\_alerts.scss`

**Statistics:**

- Total Rules: 39
- Unique Selectors: 27
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.alert-icon` defined in:
  - src\dojopool\static\scss\components_alerts.scss:76
  - src\dojopool\static\scss\components_alerts.scss:102
  - src\dojopool\static\scss\components_alerts.scss:128
  - src\dojopool\static\scss\components_alerts.scss:154
  - src\dojopool\static\scss\components_alerts.scss:180
- `hr` defined in:
  - src\dojopool\static\scss\components_alerts.scss:80
  - src\dojopool\static\scss\components_alerts.scss:106
  - src\dojopool\static\scss\components_alerts.scss:132
  - src\dojopool\static\scss\components_alerts.scss:158
  - src\dojopool\static\scss\components_alerts.scss:184
- `.alert-link` defined in:
  - src\dojopool\static\scss\components_alerts.scss:84
  - src\dojopool\static\scss\components_alerts.scss:110
  - src\dojopool\static\scss\components_alerts.scss:136
  - src\dojopool\static\scss\components_alerts.scss:162
  - src\dojopool\static\scss\components_alerts.scss:188

**Optimization Suggestions:**

- Found 3 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_avatars.scss

**File:** `src\dojopool\static\scss\components\_avatars.scss`

**Statistics:**

- Total Rules: 28
- Unique Selectors: 28
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_badges.scss

**File:** `src\dojopool\static\scss\components\_badges.scss`

**Statistics:**

- Total Rules: 29
- Unique Selectors: 24
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `&.badge-outline` defined in:
  - src\dojopool\static\scss\components_badges.scss:41
  - src\dojopool\static\scss\components_badges.scss:62
  - src\dojopool\static\scss\components_badges.scss:83
  - src\dojopool\static\scss\components_badges.scss:104
  - src\dojopool\static\scss\components_badges.scss:125
  - src\dojopool\static\scss\components_badges.scss:146

**Optimization Suggestions:**

- Found 1 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_buttons.scss

**File:** `src\dojopool\static\scss\components\_buttons.scss`

**Statistics:**

- Total Rules: 40
- Unique Selectors: 28
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `&:active` defined in:
  - src\dojopool\static\scss\components_buttons.scss:24
  - src\dojopool\static\scss\components_buttons.scss:60
  - src\dojopool\static\scss\components_buttons.scss:77
  - src\dojopool\static\scss\components_buttons.scss:97
  - src\dojopool\static\scss\components_buttons.scss:117
  - src\dojopool\static\scss\components_buttons.scss:135
  - src\dojopool\static\scss\components_buttons.scss:152
- `&:disabled` defined in:
  - src\dojopool\static\scss\components_buttons.scss:29
  - src\dojopool\static\scss\components_buttons.scss:64
  - src\dojopool\static\scss\components_buttons.scss:81
  - src\dojopool\static\scss\components_buttons.scss:102
  - src\dojopool\static\scss\components_buttons.scss:121
  - src\dojopool\static\scss\components_buttons.scss:139
  - src\dojopool\static\scss\components_buttons.scss:156

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_cards.scss

**File:** `src\dojopool\static\scss\components\_cards.scss`

**Statistics:**

- Total Rules: 37
- Unique Selectors: 30
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.card-footer,
    .card-img-bottom` defined in:
  - src\dojopool\static\scss\components_cards.scss:131
  - src\dojopool\static\scss\components_cards.scss:146
- `.card-title` defined in:
  - src\dojopool\static\scss\components_cards.scss:176
  - src\dojopool\static\scss\components_cards.scss:197
  - src\dojopool\static\scss\components_cards.scss:220
  - src\dojopool\static\scss\components_cards.scss:238
- `.card-subtitle` defined in:
  - src\dojopool\static\scss\components_cards.scss:180
  - src\dojopool\static\scss\components_cards.scss:201
- `.card-body` defined in:
  - src\dojopool\static\scss\components_cards.scss:212
  - src\dojopool\static\scss\components_cards.scss:230
- `.card-footer` defined in:
  - src\dojopool\static\scss\components_cards.scss:216
  - src\dojopool\static\scss\components_cards.scss:234

**Optimization Suggestions:**

- Found 5 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_forms.scss

**File:** `src\dojopool\static\scss\components\_forms.scss`

**Statistics:**

- Total Rules: 31
- Unique Selectors: 29
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `&[type='radio']` defined in:
  - src\dojopool\static\scss\components_forms.scss:146
  - src\dojopool\static\scss\components_forms.scss:158
- `&:checked` defined in:
  - src\dojopool\static\scss\components_forms.scss:150
  - src\dojopool\static\scss\components_forms.scss:197

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_loader.scss

**File:** `src\dojopool\static\scss\components\_loader.scss`

**Statistics:**

- Total Rules: 38
- Unique Selectors: 38
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_modals.scss

**File:** `src\dojopool\static\scss\components\_modals.scss`

**Statistics:**

- Total Rules: 33
- Unique Selectors: 28
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `-#` defined in:
  - src\dojopool\static\scss\components_modals.scss:131
  - src\dojopool\static\scss\components_modals.scss:131
- `&.is-open .modal-dialog` defined in:
  - src\dojopool\static\scss\components_modals.scss:187
  - src\dojopool\static\scss\components_modals.scss:198
  - src\dojopool\static\scss\components_modals.scss:209
  - src\dojopool\static\scss\components_modals.scss:220
  - src\dojopool\static\scss\components_modals.scss:231

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_navigation.scss

**File:** `src\dojopool\static\scss\components\_navigation.scss`

**Statistics:**

- Total Rules: 38
- Unique Selectors: 30
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `}

  .nav-link` defined in:
  - src\dojopool\static\scss\components_navigation.scss:48
  - src\dojopool\static\scss\components_navigation.scss:137

- `&.active` defined in:
  - src\dojopool\static\scss\components_navigation.scss:63
  - src\dojopool\static\scss\components_navigation.scss:152
  - src\dojopool\static\scss\components_navigation.scss:204
  - src\dojopool\static\scss\components_navigation.scss:240
  - src\dojopool\static\scss\components_navigation.scss:362
- `}

  .icon` defined in:
  - src\dojopool\static\scss\components_navigation.scss:72
  - src\dojopool\static\scss\components_navigation.scss:161

- `&:hover` defined in:
  - src\dojopool\static\scss\components_navigation.scss:200
  - src\dojopool\static\scss\components_navigation.scss:211
- `}

  & + &` defined in:
  - src\dojopool\static\scss\components_navigation.scss:248
  - src\dojopool\static\scss\components_navigation.scss:276

**Optimization Suggestions:**

- Found 5 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_tables.scss

**File:** `src\dojopool\static\scss\components\_tables.scss`

**Statistics:**

- Total Rules: 26
- Unique Selectors: 26
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_tooltips.scss

**File:** `src\dojopool\static\scss\components\_tooltips.scss`

**Statistics:**

- Total Rules: 52
- Unique Selectors: 29
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `&::before` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:47
  - src\dojopool\static\scss\components_tooltips.scss:62
  - src\dojopool\static\scss\components_tooltips.scss:77
  - src\dojopool\static\scss\components_tooltips.scss:92
- `;
left: 50%;
margin-left: -#` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:50
  - src\dojopool\static\scss\components_tooltips.scss:65
- `);

  &.show` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:58
  - src\dojopool\static\scss\components_tooltips.scss:88

- `;
margin-top: -#` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:81
  - src\dojopool\static\scss\components_tooltips.scss:96
  - src\dojopool\static\scss\components_tooltips.scss:185
  - src\dojopool\static\scss\components_tooltips.scss:190
  - src\dojopool\static\scss\components_tooltips.scss:214
  - src\dojopool\static\scss\components_tooltips.scss:219
- `&.tooltip-bottom::before` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:110
  - src\dojopool\static\scss\components_tooltips.scss:130
  - src\dojopool\static\scss\components_tooltips.scss:150
- `&.tooltip-left::before` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:114
  - src\dojopool\static\scss\components_tooltips.scss:134
  - src\dojopool\static\scss\components_tooltips.scss:154
- `&.tooltip-right::before` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:118
  - src\dojopool\static\scss\components_tooltips.scss:138
  - src\dojopool\static\scss\components_tooltips.scss:158
- `&.tooltip-top::before` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:172
  - src\dojopool\static\scss\components_tooltips.scss:201
- `;
margin-left: -#` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:175
  - src\dojopool\static\scss\components_tooltips.scss:180
  - src\dojopool\static\scss\components_tooltips.scss:204
  - src\dojopool\static\scss\components_tooltips.scss:209
- `;
  }

  &.tooltip-bottom::before` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:176
  - src\dojopool\static\scss\components_tooltips.scss:205

- `;
  }

  &.tooltip-left::before` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:181
  - src\dojopool\static\scss\components_tooltips.scss:210

- `;
  }

  &.tooltip-right::before` defined in:
  - src\dojopool\static\scss\components_tooltips.scss:186
  - src\dojopool\static\scss\components_tooltips.scss:215

**Optimization Suggestions:**

- Found 12 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_grid.scss

**File:** `src\dojopool\static\scss\layout\_grid.scss`

**Statistics:**

- Total Rules: 111
- Unique Selectors: 73
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `` defined in:
  - src\dojopool\static\scss\layout_grid.scss:25
  - src\dojopool\static\scss\layout_grid.scss:37
  - src\dojopool\static\scss\layout_grid.scss:66
  - src\dojopool\static\scss\layout_grid.scss:75
  - src\dojopool\static\scss\layout_grid.scss:187
  - src\dojopool\static\scss\layout_grid.scss:261
  - src\dojopool\static\scss\layout_grid.scss:276
  - src\dojopool\static\scss\layout_grid.scss:285
  - src\dojopool\static\scss\layout_grid.scss:294
  - src\dojopool\static\scss\layout_grid.scss:298
  - src\dojopool\static\scss\layout_grid.scss:302
  - src\dojopool\static\scss\layout_grid.scss:309
  - src\dojopool\static\scss\layout_grid.scss:313
  - src\dojopool\static\scss\layout_grid.scss:322
  - src\dojopool\static\scss\layout_grid.scss:326
- `-#` defined in:
  - src\dojopool\static\scss\layout_grid.scss:37
  - src\dojopool\static\scss\layout_grid.scss:75
  - src\dojopool\static\scss\layout_grid.scss:261
  - src\dojopool\static\scss\layout_grid.scss:285
  - src\dojopool\static\scss\layout_grid.scss:322
  - src\dojopool\static\scss\layout_grid.scss:326
- `.flex-#` defined in:
  - src\dojopool\static\scss\layout_grid.scss:200
  - src\dojopool\static\scss\layout_grid.scss:204
  - src\dojopool\static\scss\layout_grid.scss:207
  - src\dojopool\static\scss\layout_grid.scss:210
  - src\dojopool\static\scss\layout_grid.scss:213
  - src\dojopool\static\scss\layout_grid.scss:217
  - src\dojopool\static\scss\layout_grid.scss:220
- `.justify-content-#` defined in:
  - src\dojopool\static\scss\layout_grid.scss:223
  - src\dojopool\static\scss\layout_grid.scss:227
  - src\dojopool\static\scss\layout_grid.scss:230
  - src\dojopool\static\scss\layout_grid.scss:233
  - src\dojopool\static\scss\layout_grid.scss:236
  - src\dojopool\static\scss\layout_grid.scss:239
- `-start` defined in:
  - src\dojopool\static\scss\layout_grid.scss:225
  - src\dojopool\static\scss\layout_grid.scss:244
- `-end` defined in:
  - src\dojopool\static\scss\layout_grid.scss:228
  - src\dojopool\static\scss\layout_grid.scss:247
- `-center` defined in:
  - src\dojopool\static\scss\layout_grid.scss:231
  - src\dojopool\static\scss\layout_grid.scss:250
- `.align-items-#` defined in:
  - src\dojopool\static\scss\layout_grid.scss:242
  - src\dojopool\static\scss\layout_grid.scss:246
  - src\dojopool\static\scss\layout_grid.scss:249
  - src\dojopool\static\scss\layout_grid.scss:252
  - src\dojopool\static\scss\layout_grid.scss:255
- `.row-span-#` defined in:
  - src\dojopool\static\scss\layout_grid.scss:311
  - src\dojopool\static\scss\layout_grid.scss:324

**Optimization Suggestions:**

- Found 9 duplicate selectors
- Consider using CSS variables for consistent values

---

## main.scss

**File:** `src\dojopool\static\scss\pages\main.scss`

**Statistics:**

- Total Rules: 0
- Unique Selectors: 0
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_auth.scss

**File:** `src\dojopool\static\scss\pages\_auth.scss`

**Statistics:**

- Total Rules: 23
- Unique Selectors: 23
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_dashboard.scss

**File:** `src\dojopool\static\scss\pages\_dashboard.scss`

**Statistics:**

- Total Rules: 24
- Unique Selectors: 24
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_error.scss

**File:** `src\dojopool\static\scss\pages\_error.scss`

**Statistics:**

- Total Rules: 24
- Unique Selectors: 24
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_game.scss

**File:** `src\dojopool\static\scss\pages\_game.scss`

**Statistics:**

- Total Rules: 22
- Unique Selectors: 21
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.section-title` defined in:
  - src\dojopool\static\scss\pages_game.scss:72
  - src\dojopool\static\scss\pages_game.scss:144

**Optimization Suggestions:**

- Found 1 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_home.scss

**File:** `src\dojopool\static\scss\pages\_home.scss`

**Statistics:**

- Total Rules: 19
- Unique Selectors: 19
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_leaderboard.scss

**File:** `src\dojopool\static\scss\pages\_leaderboard.scss`

**Statistics:**

- Total Rules: 34
- Unique Selectors: 30
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `&.top-2` defined in:
  - src\dojopool\static\scss\pages_leaderboard.scss:107
  - src\dojopool\static\scss\pages_leaderboard.scss:232
- `&.top-3` defined in:
  - src\dojopool\static\scss\pages_leaderboard.scss:110
  - src\dojopool\static\scss\pages_leaderboard.scss:237
- `.player-info` defined in:
  - src\dojopool\static\scss\pages_leaderboard.scss:125
  - src\dojopool\static\scss\pages_leaderboard.scss:255
- `.player-title` defined in:
  - src\dojopool\static\scss\pages_leaderboard.scss:135
  - src\dojopool\static\scss\pages_leaderboard.scss:262

**Optimization Suggestions:**

- Found 4 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_news.scss

**File:** `src\dojopool\static\scss\pages\_news.scss`

**Statistics:**

- Total Rules: 37
- Unique Selectors: 29
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `}

  .article-image` defined in:
  - src\dojopool\static\scss\pages_news.scss:59
  - src\dojopool\static\scss\pages_news.scss:216

- `}

  .article-content` defined in:
  - src\dojopool\static\scss\pages_news.scss:85
  - src\dojopool\static\scss\pages_news.scss:243
  - src\dojopool\static\scss\pages_news.scss:350

- `}
  }

  .article-excerpt` defined in:
  - src\dojopool\static\scss\pages_news.scss:124
  - src\dojopool\static\scss\pages_news.scss:270

- `.article-author` defined in:
  - src\dojopool\static\scss\pages_news.scss:131
  - src\dojopool\static\scss\pages_news.scss:309
- `.author-info` defined in:
  - src\dojopool\static\scss\pages_news.scss:145
  - src\dojopool\static\scss\pages_news.scss:320
- `.author-role` defined in:
  - src\dojopool\static\scss\pages_news.scss:152
  - src\dojopool\static\scss\pages_news.scss:329
- `.article-title` defined in:
  - src\dojopool\static\scss\pages_news.scss:256
  - src\dojopool\static\scss\pages_news.scss:302

**Optimization Suggestions:**

- Found 7 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_profile.scss

**File:** `src\dojopool\static\scss\pages\_profile.scss`

**Statistics:**

- Total Rules: 25
- Unique Selectors: 25
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_search.scss

**File:** `src\dojopool\static\scss\pages\_search.scss`

**Statistics:**

- Total Rules: 33
- Unique Selectors: 33
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_settings.scss

**File:** `src\dojopool\static\scss\pages\_settings.scss`

**Statistics:**

- Total Rules: 33
- Unique Selectors: 31
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.header-description` defined in:
  - src\dojopool\static\scss\pages_settings.scss:121
  - src\dojopool\static\scss\pages_settings.scss:260
- `.item-description` defined in:
  - src\dojopool\static\scss\pages_settings.scss:207
  - src\dojopool\static\scss\pages_settings.scss:317

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_tournament.scss

**File:** `src\dojopool\static\scss\pages\_tournament.scss`

**Statistics:**

- Total Rules: 27
- Unique Selectors: 27
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## \_dark.scss

**File:** `src\dojopool\static\scss\themes\_dark.scss`

**Statistics:**

- Total Rules: 5
- Unique Selectors: 5
- Media Queries: 0
- Variables Defined: 33

---

## \_light.scss

**File:** `src\dojopool\static\scss\themes\_light.scss`

**Statistics:**

- Total Rules: 72
- Unique Selectors: 72
- Media Queries: 0
- Variables Defined: 88

---

## \_animations.scss

**File:** `src\dojopool\static\scss\utilities\_animations.scss`

**Statistics:**

- Total Rules: 78
- Unique Selectors: 68
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `` defined in:
  - src\dojopool\static\scss\utilities_animations.scss:6
  - src\dojopool\static\scss\utilities_animations.scss:14
- `to` defined in:
  - src\dojopool\static\scss\utilities_animations.scss:103
  - src\dojopool\static\scss\utilities_animations.scss:112
  - src\dojopool\static\scss\utilities_animations.scss:122
  - src\dojopool\static\scss\utilities_animations.scss:133
  - src\dojopool\static\scss\utilities_animations.scss:144
  - src\dojopool\static\scss\utilities_animations.scss:155
  - src\dojopool\static\scss\utilities_animations.scss:166
  - src\dojopool\static\scss\utilities_animations.scss:177
  - src\dojopool\static\scss\utilities_animations.scss:187
- `50%` defined in:
  - src\dojopool\static\scss\utilities_animations.scss:198
  - src\dojopool\static\scss\utilities_animations.scss:210

**Optimization Suggestions:**

- Found 3 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_colors.scss

**File:** `src\dojopool\static\scss\utilities\_colors.scss`

**Statistics:**

- Total Rules: 96
- Unique Selectors: 82
- Media Queries: 0
- Variables Defined: 6

**Duplicate Rules:**

- `-#` defined in:
  - src\dojopool\static\scss\utilities_colors.scss:7
  - src\dojopool\static\scss\utilities_colors.scss:16
  - src\dojopool\static\scss\utilities_colors.scss:25
  - src\dojopool\static\scss\utilities_colors.scss:34
  - src\dojopool\static\scss\utilities_colors.scss:43
  - src\dojopool\static\scss\utilities_colors.scss:287
  - src\dojopool\static\scss\utilities_colors.scss:293
  - src\dojopool\static\scss\utilities_colors.scss:299
- `` defined in:
  - src\dojopool\static\scss\utilities_colors.scss:7
  - src\dojopool\static\scss\utilities_colors.scss:16
  - src\dojopool\static\scss\utilities_colors.scss:25
  - src\dojopool\static\scss\utilities_colors.scss:34
  - src\dojopool\static\scss\utilities_colors.scss:43
  - src\dojopool\static\scss\utilities_colors.scss:287
  - src\dojopool\static\scss\utilities_colors.scss:293
  - src\dojopool\static\scss\utilities_colors.scss:299

**Optimization Suggestions:**

- Found 2 duplicate selectors

---

## \_display.scss

**File:** `src\dojopool\static\scss\utilities\_display.scss`

**Statistics:**

- Total Rules: 103
- Unique Selectors: 94
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.d-#` defined in:
  - src\dojopool\static\scss\utilities_display.scss:44
  - src\dojopool\static\scss\utilities_display.scss:47
  - src\dojopool\static\scss\utilities_display.scss:50
  - src\dojopool\static\scss\utilities_display.scss:53
  - src\dojopool\static\scss\utilities_display.scss:56
  - src\dojopool\static\scss\utilities_display.scss:59
  - src\dojopool\static\scss\utilities_display.scss:62
  - src\dojopool\static\scss\utilities_display.scss:65
  - src\dojopool\static\scss\utilities_display.scss:68
  - src\dojopool\static\scss\utilities_display.scss:71

**Optimization Suggestions:**

- Found 1 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_position.scss

**File:** `src\dojopool\static\scss\utilities\_position.scss`

**Statistics:**

- Total Rules: 182
- Unique Selectors: 86
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `` defined in:
  - src\dojopool\static\scss\utilities_position.scss:23
  - src\dojopool\static\scss\utilities_position.scss:26
  - src\dojopool\static\scss\utilities_position.scss:29
  - src\dojopool\static\scss\utilities_position.scss:32
  - src\dojopool\static\scss\utilities_position.scss:36
  - src\dojopool\static\scss\utilities_position.scss:39
  - src\dojopool\static\scss\utilities_position.scss:42
  - src\dojopool\static\scss\utilities_position.scss:45
  - src\dojopool\static\scss\utilities_position.scss:49
  - src\dojopool\static\scss\utilities_position.scss:56
  - src\dojopool\static\scss\utilities_position.scss:61
  - src\dojopool\static\scss\utilities_position.scss:66
  - src\dojopool\static\scss\utilities_position.scss:73
  - src\dojopool\static\scss\utilities_position.scss:78
  - src\dojopool\static\scss\utilities_position.scss:126
  - src\dojopool\static\scss\utilities_position.scss:129
  - src\dojopool\static\scss\utilities_position.scss:132
  - src\dojopool\static\scss\utilities_position.scss:135
  - src\dojopool\static\scss\utilities_position.scss:139
  - src\dojopool\static\scss\utilities_position.scss:142
  - src\dojopool\static\scss\utilities_position.scss:145
  - src\dojopool\static\scss\utilities_position.scss:148
  - src\dojopool\static\scss\utilities_position.scss:152
  - src\dojopool\static\scss\utilities_position.scss:159
  - src\dojopool\static\scss\utilities_position.scss:164
  - src\dojopool\static\scss\utilities_position.scss:169
  - src\dojopool\static\scss\utilities_position.scss:176
  - src\dojopool\static\scss\utilities_position.scss:181
  - src\dojopool\static\scss\utilities_position.scss:190
  - src\dojopool\static\scss\utilities_position.scss:193
  - src\dojopool\static\scss\utilities_position.scss:196
  - src\dojopool\static\scss\utilities_position.scss:199
  - src\dojopool\static\scss\utilities_position.scss:202
  - src\dojopool\static\scss\utilities_position.scss:207
  - src\dojopool\static\scss\utilities_position.scss:210
  - src\dojopool\static\scss\utilities_position.scss:213
  - src\dojopool\static\scss\utilities_position.scss:216
  - src\dojopool\static\scss\utilities_position.scss:220
  - src\dojopool\static\scss\utilities_position.scss:223
  - src\dojopool\static\scss\utilities_position.scss:226
  - src\dojopool\static\scss\utilities_position.scss:229
  - src\dojopool\static\scss\utilities_position.scss:233
  - src\dojopool\static\scss\utilities_position.scss:240
  - src\dojopool\static\scss\utilities_position.scss:245
  - src\dojopool\static\scss\utilities_position.scss:252
  - src\dojopool\static\scss\utilities_position.scss:255
  - src\dojopool\static\scss\utilities_position.scss:258
  - src\dojopool\static\scss\utilities_position.scss:261
  - src\dojopool\static\scss\utilities_position.scss:265
  - src\dojopool\static\scss\utilities_position.scss:272
  - src\dojopool\static\scss\utilities_position.scss:277
- `.right-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:25
  - src\dojopool\static\scss\utilities_position.scss:128
  - src\dojopool\static\scss\utilities_position.scss:209
  - src\dojopool\static\scss\utilities_position.scss:254
- `.bottom-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:28
  - src\dojopool\static\scss\utilities_position.scss:131
  - src\dojopool\static\scss\utilities_position.scss:212
  - src\dojopool\static\scss\utilities_position.scss:257
- `.left-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:31
  - src\dojopool\static\scss\utilities_position.scss:134
  - src\dojopool\static\scss\utilities_position.scss:215
  - src\dojopool\static\scss\utilities_position.scss:260
- `.-top-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:34
  - src\dojopool\static\scss\utilities_position.scss:137
  - src\dojopool\static\scss\utilities_position.scss:218
- `.-right-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:38
  - src\dojopool\static\scss\utilities_position.scss:141
  - src\dojopool\static\scss\utilities_position.scss:222
- `.-bottom-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:41
  - src\dojopool\static\scss\utilities_position.scss:144
  - src\dojopool\static\scss\utilities_position.scss:225
- `.-left-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:44
  - src\dojopool\static\scss\utilities_position.scss:147
  - src\dojopool\static\scss\utilities_position.scss:228
- `.inset-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:47
  - src\dojopool\static\scss\utilities_position.scss:150
  - src\dojopool\static\scss\utilities_position.scss:231
  - src\dojopool\static\scss\utilities_position.scss:263
- `.inset-x-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:54
  - src\dojopool\static\scss\utilities_position.scss:157
  - src\dojopool\static\scss\utilities_position.scss:238
  - src\dojopool\static\scss\utilities_position.scss:270
- `.inset-y-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:59
  - src\dojopool\static\scss\utilities_position.scss:162
  - src\dojopool\static\scss\utilities_position.scss:243
  - src\dojopool\static\scss\utilities_position.scss:275
- `.-inset-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:64
  - src\dojopool\static\scss\utilities_position.scss:167
- `.-inset-x-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:71
  - src\dojopool\static\scss\utilities_position.scss:174
- `.-inset-y-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:76
  - src\dojopool\static\scss\utilities_position.scss:179
- `-#` defined in:
  - src\dojopool\static\scss\utilities_position.scss:207
  - src\dojopool\static\scss\utilities_position.scss:210
  - src\dojopool\static\scss\utilities_position.scss:213
  - src\dojopool\static\scss\utilities_position.scss:216
  - src\dojopool\static\scss\utilities_position.scss:220
  - src\dojopool\static\scss\utilities_position.scss:223
  - src\dojopool\static\scss\utilities_position.scss:226
  - src\dojopool\static\scss\utilities_position.scss:229
  - src\dojopool\static\scss\utilities_position.scss:233
  - src\dojopool\static\scss\utilities_position.scss:240
  - src\dojopool\static\scss\utilities_position.scss:245
  - src\dojopool\static\scss\utilities_position.scss:252
  - src\dojopool\static\scss\utilities_position.scss:255
  - src\dojopool\static\scss\utilities_position.scss:258
  - src\dojopool\static\scss\utilities_position.scss:261
  - src\dojopool\static\scss\utilities_position.scss:265
  - src\dojopool\static\scss\utilities_position.scss:272
  - src\dojopool\static\scss\utilities_position.scss:277

**Optimization Suggestions:**

- Found 15 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_spacing.scss

**File:** `src\dojopool\static\scss\utilities\_spacing.scss`

**Statistics:**

- Total Rules: 91
- Unique Selectors: 33
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:7
  - src\dojopool\static\scss\utilities_spacing.scss:12
  - src\dojopool\static\scss\utilities_spacing.scss:15
  - src\dojopool\static\scss\utilities_spacing.scss:18
  - src\dojopool\static\scss\utilities_spacing.scss:21
  - src\dojopool\static\scss\utilities_spacing.scss:26
  - src\dojopool\static\scss\utilities_spacing.scss:32
  - src\dojopool\static\scss\utilities_spacing.scss:66
  - src\dojopool\static\scss\utilities_spacing.scss:71
  - src\dojopool\static\scss\utilities_spacing.scss:74
  - src\dojopool\static\scss\utilities_spacing.scss:77
  - src\dojopool\static\scss\utilities_spacing.scss:80
  - src\dojopool\static\scss\utilities_spacing.scss:85
  - src\dojopool\static\scss\utilities_spacing.scss:91
  - src\dojopool\static\scss\utilities_spacing.scss:102
  - src\dojopool\static\scss\utilities_spacing.scss:105
  - src\dojopool\static\scss\utilities_spacing.scss:108
  - src\dojopool\static\scss\utilities_spacing.scss:111
  - src\dojopool\static\scss\utilities_spacing.scss:114
  - src\dojopool\static\scss\utilities_spacing.scss:117
  - src\dojopool\static\scss\utilities_spacing.scss:121
  - src\dojopool\static\scss\utilities_spacing.scss:127
  - src\dojopool\static\scss\utilities_spacing.scss:130
  - src\dojopool\static\scss\utilities_spacing.scss:133
  - src\dojopool\static\scss\utilities_spacing.scss:136
  - src\dojopool\static\scss\utilities_spacing.scss:139
  - src\dojopool\static\scss\utilities_spacing.scss:142
  - src\dojopool\static\scss\utilities_spacing.scss:146
- `.mr-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:14
  - src\dojopool\static\scss\utilities_spacing.scss:107
  - src\dojopool\static\scss\utilities_spacing.scss:158
- `.mb-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:17
  - src\dojopool\static\scss\utilities_spacing.scss:110
  - src\dojopool\static\scss\utilities_spacing.scss:161
- `.ml-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:20
  - src\dojopool\static\scss\utilities_spacing.scss:113
  - src\dojopool\static\scss\utilities_spacing.scss:164
- `.pr-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:73
  - src\dojopool\static\scss\utilities_spacing.scss:132
- `.pb-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:76
  - src\dojopool\static\scss\utilities_spacing.scss:135
- `.pl-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:79
  - src\dojopool\static\scss\utilities_spacing.scss:138
- `-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:102
  - src\dojopool\static\scss\utilities_spacing.scss:105
  - src\dojopool\static\scss\utilities_spacing.scss:108
  - src\dojopool\static\scss\utilities_spacing.scss:111
  - src\dojopool\static\scss\utilities_spacing.scss:114
  - src\dojopool\static\scss\utilities_spacing.scss:117
  - src\dojopool\static\scss\utilities_spacing.scss:121
  - src\dojopool\static\scss\utilities_spacing.scss:127
  - src\dojopool\static\scss\utilities_spacing.scss:130
  - src\dojopool\static\scss\utilities_spacing.scss:133
  - src\dojopool\static\scss\utilities_spacing.scss:136
  - src\dojopool\static\scss\utilities_spacing.scss:139
  - src\dojopool\static\scss\utilities_spacing.scss:142
  - src\dojopool\static\scss\utilities_spacing.scss:146
- `.mt-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:104
  - src\dojopool\static\scss\utilities_spacing.scss:155
- `.mx-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:116
  - src\dojopool\static\scss\utilities_spacing.scss:167
- `.my-#` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:120
  - src\dojopool\static\scss\utilities_spacing.scss:171
- `-auto` defined in:
  - src\dojopool\static\scss\utilities_spacing.scss:153
  - src\dojopool\static\scss\utilities_spacing.scss:156
  - src\dojopool\static\scss\utilities_spacing.scss:159
  - src\dojopool\static\scss\utilities_spacing.scss:162
  - src\dojopool\static\scss\utilities_spacing.scss:165
  - src\dojopool\static\scss\utilities_spacing.scss:168
  - src\dojopool\static\scss\utilities_spacing.scss:172

**Optimization Suggestions:**

- Found 12 duplicate selectors
- Consider using CSS variables for consistent values

---

## \_typography.scss

**File:** `src\dojopool\static\scss\utilities\_typography.scss`

**Statistics:**

- Total Rules: 69
- Unique Selectors: 61
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `` defined in:
  - src\dojopool\static\scss\utilities_typography.scss:17
  - src\dojopool\static\scss\utilities_typography.scss:24
  - src\dojopool\static\scss\utilities_typography.scss:31
  - src\dojopool\static\scss\utilities_typography.scss:100
  - src\dojopool\static\scss\utilities_typography.scss:111
  - src\dojopool\static\scss\utilities_typography.scss:134
- `-#` defined in:
  - src\dojopool\static\scss\utilities_typography.scss:100
  - src\dojopool\static\scss\utilities_typography.scss:111
- `.text-#` defined in:
  - src\dojopool\static\scss\utilities_typography.scss:119
  - src\dojopool\static\scss\utilities_typography.scss:122
  - src\dojopool\static\scss\utilities_typography.scss:125

**Optimization Suggestions:**

- Found 3 duplicate selectors
- Consider using CSS variables for consistent values

---

## MarketplaceGrid.css

**File:** `src\dojopool\frontend\components\marketplace\MarketplaceGrid.css`

**Statistics:**

- Total Rules: 21
- Unique Selectors: 18
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.item-info` defined in:
  - src\dojopool\frontend\components\marketplace\MarketplaceGrid.css:54
  - src\dojopool\frontend\components\marketplace\MarketplaceGrid.css:124
- `.item-info h3` defined in:
  - src\dojopool\frontend\components\marketplace\MarketplaceGrid.css:58
  - src\dojopool\frontend\components\marketplace\MarketplaceGrid.css:127
- `.item-info p` defined in:
  - src\dojopool\frontend\components\marketplace\MarketplaceGrid.css:64
  - src\dojopool\frontend\components\marketplace\MarketplaceGrid.css:128

**Optimization Suggestions:**

- Found 3 duplicate selectors
- Consider using CSS variables for consistent values

---

## MarketplaceLayout.css

**File:** `src\dojopool\frontend\components\marketplace\MarketplaceLayout.css`

**Statistics:**

- Total Rules: 38
- Unique Selectors: 34
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.marketplace-search` defined in:
  - src\dojopool\frontend\components\marketplace\MarketplaceLayout.css:30
  - src\dojopool\frontend\components\marketplace\MarketplaceLayout.css:233
- `.marketplace-filters` defined in:
  - src\dojopool\frontend\components\marketplace\MarketplaceLayout.css:51
  - src\dojopool\frontend\components\marketplace\MarketplaceLayout.css:237
- `.marketplace-content` defined in:
  - src\dojopool\frontend\components\marketplace\MarketplaceLayout.css:65
  - src\dojopool\frontend\components\marketplace\MarketplaceLayout.css:239
- `.marketplace-sidebar` defined in:
  - src\dojopool\frontend\components\marketplace\MarketplaceLayout.css:75
  - src\dojopool\frontend\components\marketplace\MarketplaceLayout.css:245

**Optimization Suggestions:**

- Found 4 duplicate selectors
- Consider using CSS variables for consistent values

---

## LiveMatch.css

**File:** `src\dojopool\frontend\components\matches\LiveMatch.css`

**Statistics:**

- Total Rules: 24
- Unique Selectors: 23
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `100%` defined in:
  - src\dojopool\frontend\components\matches\LiveMatch.css:134
  - src\dojopool\frontend\components\matches\LiveMatch.css:143

**Optimization Suggestions:**

- Found 1 duplicate selectors
- Consider using CSS variables for consistent values

---

## achievements.css

**File:** `src\dojopool\static\css\achievements.css`

**Statistics:**

- Total Rules: 34
- Unique Selectors: 33
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.position-indicator` defined in:
  - src\dojopool\static\css\achievements.css:42
  - src\dojopool\static\css\achievements.css:113

**Optimization Suggestions:**

- Found 1 duplicate selectors
- Consider using CSS variables for consistent values

---

## alert-config.css

**File:** `src\dojopool\static\css\alert-config.css`

**Statistics:**

- Total Rules: 42
- Unique Selectors: 42
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## base.css

**File:** `src\dojopool\static\css\base.css`

**Statistics:**

- Total Rules: 11
- Unique Selectors: 11
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## chat.css

**File:** `src\dojopool\static\css\chat.css`

**Statistics:**

- Total Rules: 40
- Unique Selectors: 39
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.chat-messages-header` defined in:
  - src\dojopool\static\css\chat.css:69
  - src\dojopool\static\css\chat.css:228

**Optimization Suggestions:**

- Found 1 duplicate selectors
- Consider using CSS variables for consistent values

---

## components.css

**File:** `src\dojopool\static\css\components.css`

**Statistics:**

- Total Rules: 18
- Unique Selectors: 18
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## dashboard.css

**File:** `src\dojopool\static\css\dashboard.css`

**Statistics:**

- Total Rules: 32
- Unique Selectors: 32
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## debug-panel.css

**File:** `src\dojopool\static\css\debug-panel.css`

**Statistics:**

- Total Rules: 31
- Unique Selectors: 31
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## home.css

**File:** `src\dojopool\static\css\home.css`

**Statistics:**

- Total Rules: 26
- Unique Selectors: 25
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.btn-lg` defined in:
  - src\dojopool\static\css\home.css:59
  - src\dojopool\static\css\home.css:98

**Optimization Suggestions:**

- Found 1 duplicate selectors
- Consider using CSS variables for consistent values

---

## landing.css

**File:** `src\dojopool\static\css\landing.css`

**Statistics:**

- Total Rules: 77
- Unique Selectors: 69
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.welcome-text-cyber` defined in:
  - src\dojopool\static\css\landing.css:138
  - src\dojopool\static\css\landing.css:412
- `.description` defined in:
  - src\dojopool\static\css\landing.css:177
  - src\dojopool\static\css\landing.css:417
- `.cta-buttons` defined in:
  - src\dojopool\static\css\landing.css:187
  - src\dojopool\static\css\landing.css:398
- `.features-title` defined in:
  - src\dojopool\static\css\landing.css:249
  - src\dojopool\static\css\landing.css:422
- `.features-grid` defined in:
  - src\dojopool\static\css\landing.css:262
  - src\dojopool\static\css\landing.css:391
- `.feature-icon` defined in:
  - src\dojopool\static\css\landing.css:309
  - src\dojopool\static\css\landing.css:495
- `.feature-card h3` defined in:
  - src\dojopool\static\css\landing.css:316
  - src\dojopool\static\css\landing.css:425
- `100%` defined in:
  - src\dojopool\static\css\landing.css:541
  - src\dojopool\static\css\landing.css:547

**Optimization Suggestions:**

- Found 8 duplicate selectors
- Consider using CSS variables for consistent values

---

## layout.css

**File:** `src\dojopool\static\css\layout.css`

**Statistics:**

- Total Rules: 58
- Unique Selectors: 58
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## marketplace.css

**File:** `src\dojopool\static\css\marketplace.css`

**Statistics:**

- Total Rules: 27
- Unique Selectors: 26
- Media Queries: 0
- Variables Defined: 3

**Duplicate Rules:**

- `.search-input` defined in:
  - src\dojopool\static\css\marketplace.css:96
  - src\dojopool\static\css\marketplace.css:150

**Optimization Suggestions:**

- Found 1 duplicate selectors
- Consider using CSS variables for consistent values

---

## metrics-dashboard.css

**File:** `src\dojopool\static\css\metrics-dashboard.css`

**Statistics:**

- Total Rules: 20
- Unique Selectors: 20
- Media Queries: 0
- Variables Defined: 0

**Optimization Suggestions:**

- Consider using CSS variables for consistent values

---

## mobile.css

**File:** `src\dojopool\static\css\mobile.css`

**Statistics:**

- Total Rules: 33
- Unique Selectors: 33
- Media Queries: 0
- Variables Defined: 6

---

## notifications.css

**File:** `src\dojopool\static\css\notifications.css`

**Statistics:**

- Total Rules: 49
- Unique Selectors: 46
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.notification-settings .form-check-label` defined in:
  - src\dojopool\static\css\notifications.css:242
  - src\dojopool\static\css\notifications.css:294
- `.notification-settings .form-text` defined in:
  - src\dojopool\static\css\notifications.css:248
  - src\dojopool\static\css\notifications.css:299
- `.notification-settings .btn-primary` defined in:
  - src\dojopool\static\css\notifications.css:253
  - src\dojopool\static\css\notifications.css:303

**Optimization Suggestions:**

- Found 3 duplicate selectors
- Consider using CSS variables for consistent values

---

## pwa.css

**File:** `src\dojopool\static\css\pwa.css`

**Statistics:**

- Total Rules: 26
- Unique Selectors: 24
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `to` defined in:
  - src\dojopool\static\css\pwa.css:135
  - src\dojopool\static\css\pwa.css:142
- `100%` defined in:
  - src\dojopool\static\css\pwa.css:150
  - src\dojopool\static\css\pwa.css:168

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## rating.css

**File:** `src\dojopool\static\css\rating.css`

**Statistics:**

- Total Rules: 18
- Unique Selectors: 16
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.star` defined in:
  - src\dojopool\static\css\rating.css:8
  - src\dojopool\static\css\rating.css:79
- `.review-item` defined in:
  - src\dojopool\static\css\rating.css:43
  - src\dojopool\static\css\rating.css:82

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## responsive.css

**File:** `src\dojopool\static\css\responsive.css`

**Statistics:**

- Total Rules: 36
- Unique Selectors: 32
- Media Queries: 0
- Variables Defined: 9

**Duplicate Rules:**

- `.venue-list` defined in:
  - src\dojopool\static\css\responsive.css:40
  - src\dojopool\static\css\responsive.css:58
- `.stats-grid` defined in:
  - src\dojopool\static\css\responsive.css:42
  - src\dojopool\static\css\responsive.css:63
  - src\dojopool\static\css\responsive.css:70
  - src\dojopool\static\css\responsive.css:78

**Optimization Suggestions:**

- Found 2 duplicate selectors

---

## review.css

**File:** `src\dojopool\static\css\review.css`

**Statistics:**

- Total Rules: 31
- Unique Selectors: 24
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.review-form textarea` defined in:
  - src\dojopool\static\css\review.css:7
  - src\dojopool\static\css\review.css:159
- `.review-form textarea:focus` defined in:
  - src\dojopool\static\css\review.css:13
  - src\dojopool\static\css\review.css:167
- `.review-date` defined in:
  - src\dojopool\static\css\review.css:40
  - src\dojopool\static\css\review.css:142
- `.review-actions button` defined in:
  - src\dojopool\static\css\review.css:68
  - src\dojopool\static\css\review.css:150
- `.review-actions button:hover` defined in:
  - src\dojopool\static\css\review.css:74
  - src\dojopool\static\css\review.css:155
- `.response-item` defined in:
  - src\dojopool\static\css\review.css:89
  - src\dojopool\static\css\review.css:143
- `.response-content` defined in:
  - src\dojopool\static\css\review.css:96
  - src\dojopool\static\css\review.css:144

**Optimization Suggestions:**

- Found 7 duplicate selectors
- Consider using CSS variables for consistent values

---

## style.css

**File:** `src\dojopool\static\css\style.css`

**Statistics:**

- Total Rules: 59
- Unique Selectors: 59
- Media Queries: 0
- Variables Defined: 6

---

## styles.css

**File:** `src\dojopool\static\css\styles.css`

**Statistics:**

- Total Rules: 99
- Unique Selectors: 93
- Media Queries: 0
- Variables Defined: 19

**Duplicate Rules:**

- `body` defined in:
  - src\dojopool\static\css\styles.css:11
  - src\dojopool\static\css\styles.css:405
  - src\dojopool\static\css\styles.css:609
- `.navbar-brand img` defined in:
  - src\dojopool\static\css\styles.css:46
  - src\dojopool\static\css\styles.css:139
- `.alert` defined in:
  - src\dojopool\static\css\styles.css:103
  - src\dojopool\static\css\styles.css:160
- `.notification.unread` defined in:
  - src\dojopool\static\css\styles.css:303
  - src\dojopool\static\css\styles.css:347
- `100%` defined in:
  - src\dojopool\static\css\styles.css:596
  - src\dojopool\static\css\styles.css:632

**Optimization Suggestions:**

- Found 5 duplicate selectors

---

## tournament_bracket.css

**File:** `src\dojopool\static\css\tournament_bracket.css`

**Statistics:**

- Total Rules: 30
- Unique Selectors: 27
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.tournament-bracket__player` defined in:
  - src\dojopool\static\css\tournament_bracket.css:41
  - src\dojopool\static\css\tournament_bracket.css:112
- `.tournament-bracket__player-avatar` defined in:
  - src\dojopool\static\css\tournament_bracket.css:63
  - src\dojopool\static\css\tournament_bracket.css:116
- `.tournament-bracket__player-name` defined in:
  - src\dojopool\static\css\tournament_bracket.css:70
  - src\dojopool\static\css\tournament_bracket.css:121

**Optimization Suggestions:**

- Found 3 duplicate selectors
- Consider using CSS variables for consistent values

---

## trend-visualization.css

**File:** `src\dojopool\static\css\trend-visualization.css`

**Statistics:**

- Total Rules: 28
- Unique Selectors: 26
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.trend-stats` defined in:
  - src\dojopool\static\css\trend-visualization.css:75
  - src\dojopool\static\css\trend-visualization.css:174
- `.analysis-stats` defined in:
  - src\dojopool\static\css\trend-visualization.css:143
  - src\dojopool\static\css\trend-visualization.css:177

**Optimization Suggestions:**

- Found 2 duplicate selectors
- Consider using CSS variables for consistent values

---

## venues.css

**File:** `src\dojopool\static\css\venues.css`

**Statistics:**

- Total Rules: 60
- Unique Selectors: 56
- Media Queries: 0
- Variables Defined: 0

**Duplicate Rules:**

- `.venues-filters` defined in:
  - src\dojopool\static\css\venues.css:13
  - src\dojopool\static\css\venues.css:314
- `.filter-options` defined in:
  - src\dojopool\static\css\venues.css:32
  - src\dojopool\static\css\venues.css:316
- `.main-image` defined in:
  - src\dojopool\static\css\venues.css:153
  - src\dojopool\static\css\venues.css:320
- `.booking-card` defined in:
  - src\dojopool\static\css\venues.css:245
  - src\dojopool\static\css\venues.css:301

**Optimization Suggestions:**

- Found 4 duplicate selectors
- Consider using CSS variables for consistent values

---
