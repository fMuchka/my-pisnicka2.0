import { Plus, Trash2 } from 'lucide-react';
import Button from '../../../../../components/_core/button/Button';
import Select from '../../../../../components/_core/select/Select';
import type { SelectOption } from '../../../../../components/_core/select/types';
import Textarea from '../../../../../components/_core/textarea/Textarea';
import {
  sectionLabel,
  sectionOptionStyle,
  sectionTypeOptions,
  type SectionType,
} from '../../../../../lib/songTextEditor/sections';
import { remapSectionLines } from '../document/remapChords';
import {
  emptyLine,
  sectionLyrics,
  type DocumentSection,
  type SongDocument,
} from '../document/songDocument';
import styles from './LyricsEditor.module.css';

type LyricsEditorProps = {
  document: SongDocument;
  onChange: (document: SongDocument) => void;
};

const UNLABELLED = 'none';

const typeOptions: SelectOption[] = [
  ...sectionTypeOptions.map((type) => ({ value: type, label: sectionLabel(type) })),
  { value: UNLABELLED, label: 'Bez označení' },
];

// A song usually alternates verse and chorus, so that's the guess for the next section.
const nextSectionType = (document: SongDocument): SectionType =>
  document.at(-1)?.type === 'verse' ? 'chorus' : 'verse';

/**
 * The song as sections of plain lyrics, each with its type. Chords aren't shown here, but they
 * stay with their letters as the lyrics change.
 */
export function LyricsEditor({ document, onChange }: Readonly<LyricsEditorProps>) {
  // A new song starts with one empty verse to type into; it becomes real with the first letter.
  const sections: SongDocument =
    document.length > 0 ? document : [{ type: 'verse', lines: [emptyLine()] }];

  const updateSection = (index: number, section: DocumentSection) =>
    onChange(sections.map((current, i) => (i === index ? section : current)));

  const removeSection = (index: number) => onChange(sections.filter((_, i) => i !== index));

  const addSection = () =>
    onChange([...sections, { type: nextSectionType(sections), lines: [emptyLine()] }]);

  return (
    <div className={styles.lyrics}>
      {sections.map((section, index) => {
        const label = section.type ? sectionLabel(section.type) : 'Bez označení';
        const lyrics = sectionLyrics(section);

        return (
          <section
            // The document is re-read from the song text on every change, so position is the only
            // identity a section has. The fields are controlled, so a shift can't mix up content.
            key={index}
            className={styles.section}
            style={section.type ? sectionOptionStyle(section.type) : undefined}
            aria-label={`${label} ${index + 1}`}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.typeSelect}>
                <Select
                  aria-label="Typ sekce"
                  options={typeOptions}
                  value={section.type ?? UNLABELLED}
                  onValueChange={(value) =>
                    updateSection(index, {
                      ...section,
                      type: value === UNLABELLED ? null : (value as SectionType),
                    })
                  }
                />
              </div>
              {sections.length > 1 && (
                <Button
                  icon={Trash2}
                  styleVariation="text"
                  colorVariation="secondary"
                  aria-label={`Odebrat sekci ${label}`}
                  onClick={() => removeSection(index)}
                />
              )}
            </div>
            <Textarea
              aria-label={`Text sekce ${label}`}
              className={styles.text}
              rows={Math.max(3, section.lines.length + 1)}
              value={lyrics}
              onValueChange={(value) =>
                updateSection(index, { ...section, lines: remapSectionLines(section.lines, value) })
              }
              placeholder="Text sekce…"
            />
          </section>
        );
      })}

      <Button
        className={styles.addSection}
        icon={Plus}
        label="Přidat sekci"
        colorVariation="secondary"
        styleVariation="outlined"
        onClick={addSection}
      />
    </div>
  );
}
