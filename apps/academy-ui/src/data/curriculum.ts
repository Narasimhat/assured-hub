import { CurriculumTrack } from '../types';

export const CURRICULUM_TRACKS: CurriculumTrack[] = [
  {
    id: 'track-1',
    trackNumber: 1,
    title: 'From Patient to Pluripotency',
    subtitle: 'Derivation, Culturing & Quality Control of Human Pluripotent Stem Cells',
    icon: 'Microscope',
    color: 'from-emerald-500 to-teal-600',
    badgeName: 'Pluripotency Specialist',
    lessons: [
      {
        id: 'lesson-1-1',
        title: 'Somatic Cell Sourcing & Non-Integrating Reprogramming',
        duration: '7 min',
        summary: 'How to transition patient peripheral blood mononuclear cells (PBMCs) or dermal fibroblasts into clinical-grade hiPSCs without viral genome integration.',
        content: [
          'Human induced pluripotent stem cells (hiPSCs) represent a revolutionary paradigm for disease modeling and regenerative medicine because they maintain patient-specific genetics while retaining embryonic-like self-renewal and pluripotency.',
          'Early reprogramming relied on retroviral or lentiviral vectors, which integrate randomly into the host genome, carrying catastrophic risks of insertional mutagenesis and oncogene activation.',
          'Modern clinical workflows use non-integrating delivery systems: Sendai virus (an RNA virus replicating exclusively in the cytoplasm, gradually cleared over serial passages) or episomal plasmids (OriP/EBNA1 vectors that dilute out during cell divisions).',
          'For rare disease cohorts in low-resource settings, peripheral blood (PBMC) derivation via Sendai virus is preferred over skin biopsies: it requires only a routine 5-10 mL blood draw, avoids surgical dermabrasion, and achieves high colony formation efficiency within 18–25 days.'
        ],
        keyTakeaway: 'Always choose non-integrating reprogramming (Sendai or episomal) to ensure your rare disease model is free of viral insertion artifacts.',
        benchTip: 'Cryopreserve early passages (P3-P5) in serum-free 10% DMSO/culture medium as master stocks before undertaking any gene editing.',
        quiz: [
          {
            id: 'q1-1-1',
            question: 'Why are non-integrating Sendai viral vectors preferred over lentiviruses for deriving patient hiPSCs?',
            options: [
              'Sendai virus integrates only into safe-harbor loci like AAVS1',
              'Sendai virus is an RNA virus that replicates in the cytoplasm and is lost during cell division without genomic insertion',
              'Sendai virus increases Cas9 expression in pluripotent cells',
              'Sendai virus completely prevents p53-mediated apoptosis'
            ],
            correctIndex: 1,
            explanation: 'Sendai virus replicates in the cytoplasm without DNA intermediates and does not integrate into host chromosomes, completely diluting out over 8-10 passages.'
          }
        ]
      },
      {
        id: 'lesson-1-2',
        title: 'hiPSC Colony Morphology, Passaging & Media Dynamics',
        duration: '8 min',
        summary: 'Identifying healthy pluripotent stem cell morphology, feeder-free substrates (Geltrex/Matrigel/Laminin-521), and avoiding spontaneous differentiation.',
        content: [
          'Unlike cancer cell lines (e.g. HEK293, HeLa) that grow as resilient single cells, human PSCs are obligate colony-forming cells governed by intense E-cadherin cell-cell contacts.',
          'Under phase-contrast microscopy, undifferentiated hiPSCs display distinct hallmarks: tightly packed colonies with well-defined, smooth boundaries, high nuclear-to-cytoplasmic ratio, and prominent, prominent nucleoli.',
          'Spontaneous differentiation reveals itself through frayed colony borders, flattened cell spreading, loose cell-cell adhesion, and dark heterogeneous centers.',
          'Passage colonies as clumps rather than as single cells (the protocol passages with EDTA), except when you need a single-cell suspension for nucleofection, which the protocol prepares with TrypLE.'
        ],
        keyTakeaway: 'Keep colonies undifferentiated and do not let them overgrow. The protocol collects cells for nucleofection from a well at about 50% confluence and warns against overgrowth during cloning.',
        benchTip: 'Regularly aspirate differentiated "halos" with a fine Pasteur pipette under a stereo hood before enzymatic passaging.',
        quiz: [
          {
            id: 'q1-2-1',
            question: 'Which visual hallmark indicates healthy, undifferentiated human iPSC colonies?',
            options: [
              'Elongated, spindle-shaped fibroblast-like morphology with loose cell contacts',
              'Tightly packed cells with distinct sharp borders, high nucleus-to-cytoplasm ratio, and prominent nucleoli',
              'Large multinucleated flat syncytia spreading across the dish',
              'Single floating spherical aggregates in suspension'
            ],
            correctIndex: 1,
            explanation: 'Pluripotent colonies have smooth, phase-bright, tightly packed borders with high nuclear-to-cytoplasm ratio.'
          }
        ]
      },
      {
        id: 'lesson-1-3',
        title: 'Essential Quality Control: Pluripotency Markers & Karyotyping',
        duration: '6 min',
        summary: 'Rigorous validation using OCT4, SOX2, NANOG, trilineage embryoid body differentiation, and G-banding / digital karyotyping.',
        content: [
          'Before spending months on CRISPR editing, rigorous baseline quality control is mandatory.',
          '1. Core Pluripotency Network: Flow cytometry or immunofluorescence must show >90% of cells expressing nuclear transcription factors OCT3/4, SOX2, and NANOG, alongside surface antigens SSEA-4 and TRA-1-60.',
          '2. Trilineage Competence: Demonstrating functional pluripotency by directing spontaneous embryoid body (EB) formation or directed monolayer differentiation into all three germ layers: Ectoderm (PAX6/Tubulin beta-3), Mesoderm (NCAM/Brachyury), and Endoderm (SOX17/FOXA2).',
          '3. Genomic Stability: Prolonged passaging frequently selects for recurrent chromosomal abnormalities (Trisomy 12, Trisomy 17, 20q11.21 duplication). G-banding or digital SNP karyotyping must confirm a normal 46,XX or 46,XY karyotype.'
        ],
        keyTakeaway: 'Never edit an uncharacterized iPSC line. Validate core pluripotency markers and karyotypic integrity every 10–15 passages.',
        benchTip: 'A quick 1-hour alkaline phosphatase (AP) enzymatic staining can confirm pluripotency before setting up a major editing experiment.',
        quiz: [
          {
            id: 'q1-3-1',
            question: 'Which trio of transcription factors forms the core transcriptional regulatory circuitry of pluripotency?',
            options: [
              'TP53, RB1, BRCA1',
              'OCT4, SOX2, NANOG',
              'MYOD, RUNX2, GATA4',
              'HBB, CFTR, DMD'
            ],
            correctIndex: 1,
            explanation: 'OCT4, SOX2, and NANOG co-occupy promoter and enhancer regions to activate stem cell genes and repress lineage-specific genes.'
          }
        ]
      }
    ]
  },
  {
    id: 'track-2',
    trackNumber: 2,
    title: 'The ASSURED CRISPR Design Methodology',
    subtitle: 'Dual-Guide Strategies, Silent PAM Blocking & Asymmetric ssODN Architecture',
    icon: 'Dna',
    color: 'from-cyan-500 to-blue-600',
    badgeName: 'CRISPR Architect',
    lessons: [
      {
        id: 'lesson-2-1',
        title: 'Why Standard CRISPR Protocols Fail in hiPSCs',
        duration: '9 min',
        summary: 'Understanding the lethal p53 DNA damage response, low homologous recombination rates, and Cas9 re-cutting artifacts.',
        content: [
          'Protocols tuned on easy-to-transfect lines often work poorly in hiPSCs, which is why the ASSURED protocol was optimised for them (Ludwik et al., 2023).',
          'Why? Human pluripotent stem cells maintain hypersensitive p53-dependent surveillance. While a HEK293 cell easily survives a double-strand break (DSB), a single Cas9 cut in an iPSC triggers p21/PUMA transcription, causing cell-cycle arrest and rapid apoptotic death.',
          'Furthermore, even if the cell survives and executes Homology-Directed Repair (HDR) using your donor template, Cas9 often recognizes the target site again and re-cuts the newly repaired allele, introducing a destructive insertion or deletion (indel)!',
          'The ASSURED protocol was engineered specifically to solve these fundamental stem cell vulnerabilities through Ribonucleoprotein (RNP) transient kinetics, silent blocking mutations, and asymmetric donor design.'
        ],
        keyTakeaway: 'Pluripotent stem cells have active p53 checkpoints and low basal HDR machinery; precision editing requires suppressing re-cutting and transient RNP delivery.',
        benchTip: 'Never use lentiviral Cas9 or continuous plasmid expression in iPSCs; always deliver transient pre-assembled Cas9-sgRNA RNP complexes.',
        quiz: [
          {
            id: 'q2-1-1',
            question: 'What is the primary cause of massive cell death in hiPSCs following a Cas9 double-strand break?',
            options: [
              'Contamination from bacterial endotoxins',
              'Hyper-activation of the p53 DNA-damage response leading to PUMA-mediated apoptosis',
              'Exhaustion of glucose in the culture media',
              'Loss of E-cadherin expression'
            ],
            correctIndex: 1,
            explanation: 'Pluripotent stem cells have intact, hypersensitive p53 checkpoints that trigger apoptosis in response to double-strand breaks.'
          }
        ]
      },
      {
        id: 'lesson-2-2',
        title: 'The Silent PAM Block & Seed-Region Mutation Strategy',
        duration: '10 min',
        summary: 'How to introduce synonymous mutations in the ssODN template to prevent Cas9 re-cutting without altering protein coding or splicing.',
        content: [
          'When designing a single-stranded oligodeoxynucleotide (ssODN) for SNP correction or knock-in, the most critical step is ensuring the newly edited sequence is immune to Cas9 re-cleavage.',
          'Cas9 requires two elements to cut: 1) A Protospacer Adjacent Motif (5\'-NGG-3\' for SpCas9) on the non-target strand, and 2) Complementarity across the 20-nt guide RNA, especially the 8-10 base pair "seed region" immediately adjacent to the PAM.',
          'In an ASSURED knock-in the donor carries the intended change and, where needed, a change that stops Cas9 from cutting the repaired allele again: a silent mutation in a codon covering the PAM (one of the two Gs), or a change in the last five nucleotides of the seed sequence.',
          'The protocol adds that this is not always possible or needed: if the SNP to be introduced already lies in the GG of the PAM, extra mutations might not be necessary because re-cutting is then limited. Use a codon usage table when you choose silent changes.'
        ],
        keyTakeaway: 'Prevent re-cutting of the repaired allele: if the edit does not already disrupt the PAM, add a silent PAM or seed change where one exists (protocol steps 23 and 24).',
        benchTip: 'Check silent changes against a codon usage table before you order, as the protocol advises.',
        quiz: [
          {
            id: 'q2-2-1',
            question: 'Why does the ASSURED CRISPR Designer introduce silent mutations into the ssODN donor template?',
            options: [
              'To increase the molecular weight of the donor oligonucleotide',
              'To prevent Cas9 from recognizing and re-cleaving the successfully edited allele',
              'To stimulate bacterial homologous recombination enzymes',
              'To increase mRNA translation speed by 50%'
            ],
            correctIndex: 1,
            explanation: 'Silent PAM or seed mutations prevent Cas9 from recognizing the edited allele, locking in the precision correction.'
          }
        ]
      },
      {
        id: 'lesson-2-3',
        title: 'Asymmetric ssODN Homology Arms & Splice Junction Safety',
        duration: '8 min',
        summary: 'Optimizing 5\' and 3\' arm lengths (36 nt vs 91 nt), strand orientation, and avoiding cryptic splice sites.',
        content: [
          'The protocol follows the HDR template design recommended by Richardson et al.: a single-stranded template 127 nt long.',
          'The template is asymmetric about the cut: 36 nt of homology on the PAM-distal side and 91 nt on the PAM-proximal side. It uses the target strand (the non-PAM strand) as the template, that is, the reverse complement of the gRNA sequence.',
          'Splice Assessment: In exons, any silent change must be vetted to prevent creating cryptic splice donor (GT) or acceptor (AG) motifs, or disrupting exonic splicing enhancers (ESEs).',
          'ASSURED Designer automatically verifies that all blocking changes stay outside critical splice junctions.'
        ],
        keyTakeaway: 'ASSURED ssODN: 127 nt, a 36-nt PAM-distal arm, a 91-nt PAM-proximal arm, non-PAM strand as the template. Small tags need longer templates (140 and 170 nt for inserts of about 60 and 70 bp in the paper).',
        benchTip: 'The protocol uses an Alt-R HDR modified ssODN. Order that product rather than designing end modifications yourself.',
        quiz: [
          {
            id: 'q2-3-1',
            question: 'In the ASSURED ssODN, which side of the cut gets the longer homology arm?',
            options: [
              'The PAM-proximal side (91 nt, against 36 nt on the PAM-distal side)',
              'The PAM-distal side (91 nt)',
              'Both sides equally (63 nt each)',
              'Neither: the donor has no homology arms'
            ],
            correctIndex: 0,
            explanation: 'The protocol recommends a 127-nt asymmetric template with a 36-nt distal and a 91-nt proximal homology arm, using the non-PAM strand as the template.'
          }
        ]
      }
    ]
  },
  {
    id: 'track-3',
    trackNumber: 3,
    title: 'The Virtual Wet-Lab & Frugal Bench',
    subtitle: 'From Electroporation & Apoptosis Rescue to Monoclonal Sub-Cloning',
    icon: 'FlaskConical',
    color: 'from-amber-500 to-orange-600',
    badgeName: 'Master of the Bench',
    lessons: [
      {
        id: 'lesson-3-1',
        title: 'Pre-Nucleofection Cell Health & RNP Assembly',
        duration: '8 min',
        summary: 'Cell state before nucleofection, the Table 7 RNP mixes, and the Neon settings of the protocol.',
        content: [
          'The protocol re-plates cells the day before delivery (Day -1) to synchronise the cell cycle, so that more cells are in S-phase, when HDR is most active.',
          'Cells for one nucleofection come from a well at about 50% confluence, which usually gives about 1 × 10⁶ cells, so count them before you start. Plate 2 × 10⁵ cells in each of 2 wells of a 6-well plate: one well for the nucleofection and one as the untransfected control.',
          'RNP mixes follow Table 7. For a two-guide knock-in: Cas9 1 µL, gRNA 2 + 2 µL, ssODN 3 µL (12.5 µM Alt-R HDR modified) and R buffer 7 µL, 15 µL in total. The mix of Cas9 and gRNAs is incubated at room temperature for 10 to 20 minutes, and the ssODN is added immediately before transfection.',
          'Delivery uses the Neon system with the 10 µL kit: tip 10 µL, 1200 V, 30 ms, 1 pulse. Other systems can be used with appropriate optimisation; the paper gives no settings for them.'
        ],
        keyTakeaway: 'Re-plate on Day -1, collect cells from a well at about 50% confluence, assemble the RNP per Table 7, add the ssODN just before the pulse, and electroporate with the Neon system at 1200 V, 30 ms, 1 pulse.',
        benchTip: 'Coat the receiving wells and prepare StemFlex/CloneR2 at room temperature before you start the electroporation, as the protocol does.',
        quiz: [
          {
            id: 'q3-1-1',
            question: 'About what confluence is the well from which the protocol collects cells for a nucleofection?',
            options: [
              'About 50% (usually about 1 × 10⁶ cells per well)',
              '20-30% (sparse individual cells)',
              '100% (a fully confluent monolayer)',
              'Confluence does not matter'
            ],
            correctIndex: 0,
            explanation: 'The protocol passages cells from one well at about 50% confluence, which usually gives about 1 × 10⁶ cells, and advises counting the cells before the experiment.'
          }
        ]
      },
      {
        id: 'lesson-3-2',
        title: 'Electroporation & Recovery with CloneR2',
        duration: '9 min',
        summary: 'The Neon settings of the protocol and recovery of single cells in StemFlex/CloneR2.',
        content: [
          'Human PSCs are prone to a specialized form of detachment-induced apoptosis called anoikis, mediated by the ROCK (Rho-associated protein kinase) signaling pathway.',
          'The protocol dissociates cells into single cells with TrypLE and electroporates them with the Neon system (10 µL tip, 1200 V, 30 ms, 1 pulse). Single hiPSCs survive poorly, so the cells are recovered in StemFlex supplemented with CloneR2.',
          'CloneR2 promotes clonal survival and growth of hiPSCs during single-cell passaging and improves the efficiency of colony formation from single cells (the paper\'s description). The protocol uses StemFlex/CloneR2 after delivery and during cloning.',
          'Follow the protocol for how long CloneR2 stays in the medium; this course does not restate the schedule.'
        ],
        keyTakeaway: 'Recover single cells in StemFlex/CloneR2. The paper gives no survival figure for leaving it out.',
        benchTip: 'Coat the receiving wells (1 h) and prepare StemFlex/CloneR2 at room temperature before you start the pulse, as the protocol does.',
        quiz: [
          {
            id: 'q3-2-1',
            question: 'Which supplement does the ASSURED protocol add to StemFlex to improve the survival of single cells after delivery and during cloning?',
            options: [
              'CloneR2',
              'Matrigel',
              'Fetal bovine serum',
              'Retinoic acid'
            ],
            correctIndex: 0,
            explanation: 'The paper describes CloneR2 as promoting clonal survival and growth of hiPSCs during single-cell passaging and improving the efficiency of colony formation from single cells.'
          }
        ]
      },
      {
        id: 'lesson-3-3',
        title: 'Single-Cell Cloning: isoCell, Limiting Dilution and Clone Picking',
        duration: '10 min',
        summary: 'The platform the paper uses, the alternatives it names, and the Poisson arithmetic behind limiting dilution.',
        content: [
          'Therapeutic disease modeling requires pure, isogenic monoclonal cell lines. If you sequence a bulk pool of edited cells, you get a confusing mixture of WT, heterozygous, homozygous, and indel alleles.',
          'The paper uses the isoCell single-cell cloning platform: 256 wells per plate, about 40% outgrowth and about 100 clones. It notes that limiting dilution and clone picking can be used instead.',
          'The paper gives no seeding density or expected yield for the alternatives, so a lab that uses them has to establish its own seeding and yield, and confirm that colonies derive from a single cell.',
          'Poisson arithmetic for limiting dilution at 0.5 cells per well: 60.7% of wells are empty, 30.3% receive one cell and 9.0% receive two or more, so about 23% of the wells that receive any cell receive two or more. At 0.3 cells per well the figures are 74.1% empty, 22.2% single and 3.7% two or more (14% of occupied wells): fewer multi-cell wells, more empty ones.',
          'Check colonies by eye or by imaging while they are small: a colony that looks like two merged colonies is not single-cell derived.'
        ],
        keyTakeaway: 'isoCell is what the paper describes. Limiting dilution and clone picking are named alternatives with no settings given; at 0.5 cells per well about 23% of the wells that hold any cell receive two or more.',
        benchTip: 'Discard wells whose colonies look like two merged colonies.',
        quiz: [
          {
            id: 'q3-3-1',
            question: 'At an average of 0.5 cells per well, what fraction of the wells that contain any cell receive two or more cells (Poisson)?',
            options: [
              'About 23%',
              'Less than 1%',
              'About 5%',
              'About 60%'
            ],
            correctIndex: 0,
            explanation: 'At 0.5 cells per well 60.7% of wells are empty, 30.3% hold one cell and 9.0% hold two or more, so 9.0/39.3 = 23% of occupied wells hold two or more.'
          }
        ]
      }
    ]
  },
  {
    id: 'track-4',
    trackNumber: 4,
    title: 'Sanger QC, Deconvolution & Clone Calling',
    subtitle: 'From AB1 Chromatograms to Calling Homozygous, Heterozygous & Mosaic Clones',
    icon: 'Binary',
    color: 'from-purple-500 to-indigo-600',
    badgeName: 'Certified QC Analyst',
    lessons: [
      {
        id: 'lesson-4-1',
        title: 'Reading Sanger .ab1 Chromatograms & Trace Quality',
        duration: '7 min',
        summary: 'Understanding four-color fluorescence traces, signal-to-noise ratio, base calling quality scores, and PCR amplification primer placement.',
        content: [
          'Sanger sequencing remains the gold standard for clone validation due to its rapid turnaround, accessibility in every hospital and university, and low cost compared to next-gen sequencing.',
          'An ABIF (.ab1) file contains raw four-color electrophoretic fluorescence measurements: Adenine (green), Thymine (red), Cytosine (blue), and Guanine (black/yellow).',
          'Good quality trace indicators: uniform peak spacing, sharp peaks, and clean single peaks in the unedited control.',
          'Poor quality indicators: broad overlapping peaks, dye blobs near the start of the read, or signal that drops off early. The protocol selects about 250 bp up- and downstream of the target and designs primers that amplify 400 to 450 bp with the cut site as close to the middle as possible.'
        ],
        keyTakeaway: 'Design two primer pairs on the genomic region with Primer-BLAST, amplifying 400 to 450 bp with the cut site near the middle, and Sanger-sequence your own line first to rule out SNPs (protocol steps 17 to 20).',
        benchTip: 'Run both Forward and Reverse sequencing reactions on every candidate clone to definitively resolve strand-specific sequencing artifacts.',
        quiz: [
          {
            id: 'q4-1-1',
            question: 'How does the protocol position the PCR amplicon relative to the cut site?',
            options: [
              'About 400 to 450 bp long, with the cut site as close to the middle as possible',
              'With the cut site inside the 20-nt guide-binding primer',
              'With the cut site at the very end of the amplicon',
              'A 5,000 bp amplicon'
            ],
            correctIndex: 0,
            explanation: 'Step 19 of the protocol: use Primer-BLAST to design primers that amplify 400 to 450 bp with the cut site position as close to the middle as possible.'
          }
        ]
      },
      {
        id: 'lesson-4-2',
        title: 'Deconvolution Algorithms: Decomposing Mixed Peaks',
        duration: '9 min',
        summary: 'How Assured QC and ICE-like algorithms mathematically decompose mixed Sanger traces to calculate knock-in vs indel percentages.',
        content: [
          'When analyzing an edited clone or bulk cell pool, chromatograms downstream of the Cas9 cleavage site frequently become a confusing jumble of overlapping peaks.',
          'This happens because different alleles in the sample (or between homologous chromosomes) carry insertions, deletions, or nucleotide substitutions of varying lengths, causing the sequencing reads to shift out of phase.',
          'Assured QC uses Non-Negative Least Squares (NNLS) and dynamic trace alignment against an unedited control trace to mathematically deconvolute the mixed signal into its underlying constituent alleles.',
          'By comparing the deconvoluted trace against your ASSURED Design Report, the software quantifies the exact contribution of the wild-type allele, the intended knock-in allele (with silent blocks), and any unpredicted indel frameshifts.'
        ],
        keyTakeaway: 'Overlapping chromatogram peaks are not failed sequencing—they represent out-of-phase alleles that can be mathematically deconvoluted.',
        benchTip: 'Always upload an unedited parent control .ab1 file alongside your edited clone traces in Assured QC for high-precision alignment.',
        quiz: [
          {
            id: 'q4-2-1',
            question: 'What causes the sudden appearance of overlapping double-peaks downstream of a Cas9 cut site on a Sanger chromatogram?',
            options: [
              'Contamination with another researcher’s DNA',
              'A mixture of alleles (e.g. frameshift indel on one chromosome and WT or knock-in on the other) causing out-of-phase sequence reads',
              'Degradation of the capillary electrophoresis polymer',
              'Over-incubation of the sequencing primer'
            ],
            correctIndex: 1,
            explanation: 'When one allele has an insertion or deletion, the Sanger read shifts by that number of nucleotides, causing two distinct sequences to be read simultaneously.'
          }
        ]
      },
      {
        id: 'lesson-4-3',
        title: 'Calling Zygosity: Homozygous KI vs. Heterozygous vs. Mosaicism',
        duration: '9 min',
        summary: 'Classifying clones for disease modeling; avoiding mono-allelic edits with undetected indels on the second allele.',
        content: [
          'For recessive monogenic rare diseases (or when creating an isogenic rescue of a homozygous patient line), you need to correctly classify your 96-well candidate clones into four distinct categories:',
          '1. True Homozygous Knock-In (Ideal): Both maternal and paternal alleles contain the intended correction AND silent PAM blocks, with 100% clean single peaks and 0% indel signal.',
          '2. Heterozygous Edit (Carrier / Dominant Model): Exactly 50% signal for the knock-in allele and 50% for the wild-type allele.',
          '3. Compound Heterozygous / Knock-In + Indel (Hazardous!): One allele carries the desired knock-in, but the second allele carries an unexpected 1-bp or 2-bp indel knockout. Many automated tools incorrectly label this as "Heterozygous" if they don\'t perform rigorous deconvolution!',
          '4. Mosaic Clones: Three or more distinct alleles present, indicating the colony arose from more than one founding cell or editing occurred late after the first cell division. These must be rejected or re-sub-cloned.'
        ],
        keyTakeaway: 'Always verify both alleles. An apparent heterozygous clone might harbor a destructive knockout indel on the opposite chromosome.',
        benchTip: 'Assured QC flags compound heterozygotes and mosaics automatically—never expand a clone until its second allele is completely characterized.',
        quiz: [
          {
            id: 'q4-3-1',
            question: 'Why must you be cautious when an editing report labels a clone as "heterozygous"?',
            options: [
              'Because heterozygous clones are unable to divide',
              'Because the opposite allele may harbor an uncharacterized frameshift indel rather than true intact wild-type DNA',
              'Because heterozygous clones cannot be differentiated into neurons',
              'Because heterozygous cells lose pluripotency within 2 passages'
            ],
            correctIndex: 1,
            explanation: 'Many standard assays miss that the non-edited allele has a 1- or 2-bp deletion (compound heterozygote) rather than remaining clean wild-type.'
          }
        ]
      }
    ]
  }
];
