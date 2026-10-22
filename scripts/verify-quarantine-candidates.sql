-- SELECT-only candidate verification for production hnzwraiojsftuncridsp.
-- This file does not quarantine or delete anything. Review production-quarantine.md first.
-- Source snapshot: 2026-10-22 19:23:10.785765+00; 58 exact IDs, 41 known fixtures, 17 origin-unconfirmed.
with expected(id, external_id, url, fingerprint) as (
  values
  ('00a9838e-4979-48cd-9111-6c9e251c64e9'::uuid, 'test-r01-trusted-1792408685928', 'https://herald.example.com/trusted-ingestion-report', 'e4b19e8821f47e51b7e2ac4e1429d442'),
  ('00d48248-c9b9-4ceb-9bb7-a37a6ac2ecb8'::uuid, 'test-r01-trusted-1792408639486', 'https://herald.example.com/trusted-ingestion-report', '032d3cbeeadc456ee9568bdf48320d9c'),
  ('0156df11-ed57-4a08-a445-fb3d54d7de69'::uuid, 'test-r01-trusted-1792407935771', 'https://herald.example.com/trusted-ingestion-report', 'bb5ffbcf66a9c550035dfd65beb51514'),
  ('060f15d6-36c3-47a0-ae38-e257d9821b55'::uuid, 'test-r01-trusted-1792325412845', 'https://herald.example.com/trusted-ingestion-report', '15f0ac1d307f2c1366ec434ac0903e31'),
  ('07fc3740-7f6f-4911-b906-b86b26d93d54'::uuid, 'herald-feat-quantum-grid-2026', 'https://example.com/solar-liquid-metal-storage', '4088b8da3f3dcf7b74ce6a7c038d49c7'),
  ('09cf9046-5dae-4e74-977e-2e3ad6f472fe'::uuid, 'fake-lock-test', 'https://example.com/fake', '0d93dd03b5a7170331a9544c292f88bb'),
  ('0bbc68b8-b8da-4c5f-ac81-8ea99dd09a21'::uuid, 'test-r01-trusted-1792404645469', 'https://herald.example.com/trusted-ingestion-report', '967ed6f7c71d1aa0f03c0256e8b91e99'),
  ('11bbb632-b485-4c66-a74c-1feacea36bb5'::uuid, 'herald-feat-urban-ag-2026', 'https://example.com/urban-farming-waterfront', '7e7adca9024dd3f994e08571f82770a1'),
  ('174096f3-1088-4285-879e-db5996911944'::uuid, 'test-r01-trusted-1792325394455', 'https://herald.example.com/trusted-ingestion-report', 'b5aa1022dffafa57b7bfe12af82d597f'),
  ('2b6023e3-f097-42d3-90c5-8bd7d15a439f'::uuid, 'test-r01-trusted-1792326699368', 'https://herald.example.com/trusted-ingestion-report', 'aafd49f1e126d945badec85d9aee1194'),
  ('2c4b454b-7a13-4d13-81ae-6f9b4d0f4031'::uuid, 'test-r01-trusted-1792327441285', 'https://herald.example.com/trusted-ingestion-report', '2957f678ce89651d6469d8727831af50'),
  ('2eb7005b-6a18-4d87-81e4-1b136ea8106e'::uuid, 'test-r01-trusted-1792409901719', 'https://herald.example.com/trusted-ingestion-report', 'f6d6626a2e16d369747a604452306f66'),
  ('31a9fd17-5f6e-4ccb-b0b7-72e547ae76d3'::uuid, 'test-r01-trusted-1792318309490', 'https://herald.example.com/trusted-ingestion-report', 'a25f3e3639c86b887c7255aa21e0806c'),
  ('35406079-084e-4c46-968d-0da19797ecf4'::uuid, 'test-r01-trusted-1792407774971', 'https://herald.example.com/trusted-ingestion-report', '7bc7a026330bd4998ef6a835c5cc8bde'),
  ('36d5e712-1da3-4e6c-829c-1508cd66f761'::uuid, 'test-r01-trusted-1792320956146', 'https://herald.example.com/trusted-ingestion-report', 'b88af3ec12b77da058f0d302bf4160f5'),
  ('3afeab7a-76d4-4954-b347-abf5d2e23df8'::uuid, 'herald-feat-cabo-verde-2026', 'https://example.com/cabo-verde-hiking-destination', '1be9f1a5093e40e15fd995e8428da565'),
  ('430ddb38-130e-481d-954f-1973c8e67ce3'::uuid, 'herald-feat-clean-water-2026', 'https://example.com/ultralight-water-filter-tech', '7dd557adf97f7f2f9edafa5042c08b3e'),
  ('493037b6-8b97-4594-a190-55e39768d30b'::uuid, 'test-r01-trusted-1792318904661', 'https://herald.example.com/trusted-ingestion-report', 'd1b8c186f27942befef818bd734351f3'),
  ('4932f216-90b1-480e-949a-da71fc8a8b8d'::uuid, 'test-r01-trusted-1792406521959', 'https://herald.example.com/trusted-ingestion-report', '13ca81a2311741fda163c9d58569b7df'),
  ('4bc30b62-e25e-4fa6-84db-7934e6af7509'::uuid, 'test-r01-trusted-1792409933130', 'https://herald.example.com/trusted-ingestion-report', 'be342fe980bf06423a504e7eadeb062c'),
  ('5758cd41-e8b9-42ec-93b9-73c49dcd5015'::uuid, 'test-r01-trusted-1792318295177', 'https://herald.example.com/trusted-ingestion-report', 'a41272d0a87394095df94b0f9791678f'),
  ('66f5d05b-3292-4f89-9674-94d0cddafacc'::uuid, 'herald-feat-atv-selangor-2026', 'https://example.com/atv-world-tour-selangor', '6e2fbc4e761a5289c30ca68caa8a604e'),
  ('6a7677ea-980e-465f-9651-301c8b204286'::uuid, 'test-r01-trusted-1792326726400', 'https://herald.example.com/trusted-ingestion-report', 'b07ab51a38b6e7f6d87b073570d9fced'),
  ('724f0fe8-3757-4873-b3b8-45fe657b9821'::uuid, 'test-r01-trusted-1792324724989', 'https://herald.example.com/trusted-ingestion-report', '240bef1aed954f4439f5ca625359422c'),
  ('769967e6-c00e-4b54-b4db-7c61cbd12f92'::uuid, 'herald-feat-asia-tourism-2026', 'https://example.com/asia-sustainable-tourism', 'f25db0edc3692cca50280f1ac06fac3e'),
  ('78288a21-9b5f-47e6-b988-cc390967dfa6'::uuid, 'test-r01-trusted-1792406553485', 'https://herald.example.com/trusted-ingestion-report', '31ee5410a06e67ed0182e1b4c4285b05'),
  ('7bad46a0-f167-4c08-be03-16d87a0979cd'::uuid, 'test-r01-trusted-1792324713535', 'https://herald.example.com/trusted-ingestion-report', '164deea2ecc06fc2a6151b0661066547'),
  ('7f4f03b3-6d43-4907-897f-f49dd584d286'::uuid, 'test-r01-trusted-1792318917013', 'https://herald.example.com/trusted-ingestion-report', 'afa6033817fe8509553f9a90a97f9c8d'),
  ('84302e20-2924-4c27-a97f-69df28bacaf3'::uuid, 'test-r01-trusted-1792319096863', 'https://herald.example.com/trusted-ingestion-report', 'e2dbee0ce19c2eac2855f61bb84366d4'),
  ('9ac1eadd-ceec-4e4a-8952-10256c8faa99'::uuid, 'test-r01-trusted-1792407820159', 'https://herald.example.com/trusted-ingestion-report', 'a95dcd82479190f4e83c4d44042ba877'),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'prov-a-art-1', 'https://wire-a.example.com/clean-energy-transition?utm_source=rss', '63190d241bebdd01a987ba1f98db7c9b'),
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'r01-test-supply-1', 'https://example.com/quantum-coherence-2026', '15e16f2edfd834f60ec0e379a95a2c1c'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'r01-test-supply-2', 'https://example.com/clean-grid-standards-2026', 'ad7be9d5edadc50e764a9fbc6375eae6'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'r01-test-supply-3', 'https://example.com/maritime-treaty-2026', 'e5d60bc20e8a434a0d241463205517b7'),
  ('a3de8f92-4c95-4d6a-9fb0-105fc2f10d4b'::uuid, 'herald-feat-appalachian-trail-2026', 'https://example.com/will-french-appalachian-trail', '842b36633aafd8f0a14ea3fec61b9fda'),
  ('b0000000-0000-0000-0000-000000000002'::uuid, 'prov-b-art-2', 'https://wire-b.example.com/semiconductor-fab-investments#section-1', 'c281528e9edbc55e250b5b8cbef9f2ef'),
  ('b96678fc-5904-4683-8d65-0ef44f9df6e3'::uuid, 'test-r01-trusted-1792318375149', 'https://herald.example.com/trusted-ingestion-report', 'a1b401fb096ee73445d79bbbafc4f899'),
  ('ba9ca6d8-038a-4fbc-b17e-01ae20693db3'::uuid, 'test-r01-trusted-1792318361647', 'https://herald.example.com/trusted-ingestion-report', '1c3ec1cf2358bfcf33c9549bcd19b3ce'),
  ('c4b28c2a-d496-4cc2-bdf1-1d90ac9eaa1e'::uuid, 'test-r01-trusted-1792409683396', 'https://herald.example.com/trusted-ingestion-report', 'e78b380ef6f331251fe9796c8334e7cb'),
  ('c69e71f7-b001-4b98-8298-82c8d73824e0'::uuid, 'test-r01-trusted-1792404678736', 'https://herald.example.com/trusted-ingestion-report', '8a9656666b63a84b4b6a2b9eda12c87d'),
  ('c83c495b-591e-4611-a73d-24cac4d528ff'::uuid, 'test-r01-trusted-1792407980589', 'https://herald.example.com/trusted-ingestion-report', '533215378a285642d1be6957d2ef7dfa'),
  ('c8d44e2f-8b10-4419-a072-6de0432c54f2'::uuid, 'test-r01-trusted-1792327423055', 'https://herald.example.com/trusted-ingestion-report', '4e5597db7be2521cd4e4b8c10847eb3f'),
  ('dbd7d741-3203-44b8-8fa2-0d6e85e773a5'::uuid, 'test-r01-trusted-1792409803603', 'https://herald.example.com/trusted-ingestion-report', 'a4b7f9a15c3e8f8dc23066166ebb06be'),
  ('deef8f74-4237-4e7e-9b1d-a26f09020280'::uuid, 'herald-feat-okinawa-2026', 'https://example.com/adventure-week-okinawa', '9fda29da035e5c49a711d5a2024b6636'),
  ('df225f63-c159-4114-bccd-cbff042717f6'::uuid, 'test-r01-trusted-1792320969250', 'https://herald.example.com/trusted-ingestion-report', 'c60081f5c69dfefba298ecde19cec36c'),
  ('e17f46f7-fc49-4e7a-be29-2028c1582ed2'::uuid, 'herald-feat-deep-space-array-2026', 'https://example.com/mars-laser-communications', '5fe2f0b153bdc1addaba4eca385128b4'),
  ('e66b8bb6-13a1-4fa8-a803-cf909438b68b'::uuid, 'probe-anonymous-write-test', 'https://example.com/probe', '280f67726495b0de611046b9a8411d59'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid, 'test-supply-1', 'https://example.com/science-breakthrough', 'fb933c036e375f3edc312f269f6d4da2'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d480'::uuid, 'test-supply-2', 'https://example.com/tech-rally', '20f4a6269d048f10f79c3af1c7cf7663'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d491'::uuid, 'test-supply-pdf-1', 'https://example.com/clean-energy-pdf', '4d293bc865421741bb25915683d9505d'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d492'::uuid, 'test-supply-pdf-2', 'https://example.com/robotics-pdf', '7f8b7af5efe061bbc431d88eecd01eb2'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d493'::uuid, 'test-supply-browser-1', 'https://example.com/clean-energy-browser', 'a15cc633fff77159bb16f1e87b4d73bc'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d494'::uuid, 'test-supply-browser-2', 'https://example.com/robotics-browser', 'e6f7b03e212e931304cc127e1cab0828'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d495'::uuid, 'test-supply-browser-3', 'https://example.com/ocean-vents-browser', '4afb8dbda61bb8bde82b104db09d0c84'),
  ('f4ac7524-0d53-48cb-9c6c-679460974b15'::uuid, 'herald-feat-lake-district-2026', 'https://example.com/lake-district-outdoor-adventure', 'cd53aa2aa941d6acaa2833df81fd26eb'),
  ('f5297113-2fe2-43e5-a720-4e2b7d120321'::uuid, 'herald-feat-atmosphere-2026', 'https://example.com/atmospheric-circulation-mountain', '80c0605637c9661115f28a9903de6818'),
  ('ff103eb9-c89f-470b-b8e8-63a938c01fd9'::uuid, 'test-r01-trusted-1792319110774', 'https://herald.example.com/trusted-ingestion-report', '782409816f08de025d1d594beab73628'),
  ('ffa9535c-835a-4f9b-bde8-cc349b0808e8'::uuid, 'herald-feat-climate-edu-2026', 'https://example.com/family-climate-education', '6eb452c84e5b7530de0ffabab6f6f55b')
)
select e.id, e.external_id, e.url,
  case
    when current_setting('TimeZone') <> 'UTC' then 'timezone_mismatch'
    when a.id is null then 'missing'
    when a.external_id is distinct from e.external_id or a.url is distinct from e.url
      or md5(to_jsonb(a)::text) is distinct from e.fingerprint then 'row_changed'
    else 'unchanged_candidate'
  end as review_status,
  (select count(*) from public.edition_stories s where s.source_article_id = e.id) as current_direct_saved_story_references
from expected e
left join public.source_articles a on a.id = e.id
order by e.id;
