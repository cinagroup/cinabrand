# 朱雀仿宋 / Zhuque Fangsong

Unmodified **Zhuque Fangsong Regular** from the official [v0.212 release](https://github.com/TrionesType/zhuque/releases/tag/v0.212) by TrionesType / 璇玑造字.

- Release archive: [`ZhuqueFangsong-v0.212.zip`](https://github.com/TrionesType/zhuque/releases/download/v0.212/ZhuqueFangsong-v0.212.zip).
- Archive SHA-256 (also published in GitHub release metadata): `bb8b661a7643d2296a72d9d10530a00949419c4e527fb61783f73c2ba1a8c062`.
- Archive member: `ZhuqueFangsong-Regular.ttf`, 8,824,084 bytes.
- Font SHA-256: `558c62730844fe54ba220146ed62f859d4e2880188d92d985f8921c6e3743bc4`.
- License: [SIL Open Font License 1.1](OFL.txt), copied unchanged from the [release tag](https://github.com/TrionesType/zhuque/blob/v0.212/LICENSE.txt).
- Copyright notice in the supplied license: Copyright (c) 2023, Zhejiang JadeFoci Techonology Co. LTD.

The upstream release is labelled a technical preview. This repository pins that exact font and extracts only the two reviewed glyphs `海内`; future font changes do not automatically change the logo. The [official project](https://github.com/TrionesType/zhuque#许可证) explicitly permits commercial print and logo use under OFL 1.1.

`scripts/fangsong-wordmark.mjs` extracts the original outlines at 1000 units/em, with the font's original advances and kerning. No horizontal stretching, artificial bolding, corner modification, or font subsetting is applied. The visible bounds are `53 -807 1817 919`. Generated lettering is fixed vector artwork and does not require installation of the font. The original full font binary is distributed unchanged with its license; no modified font software is distributed.

The circled registration symbol in the kit continues to use the separately pinned Geist font. Combined SVGs embed the approved full-color symbol bitmap and vector lettering; independent FangSong wordmark SVGs contain only vector paths.
