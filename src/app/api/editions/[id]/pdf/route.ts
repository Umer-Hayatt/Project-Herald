import { NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getArchivedEditionById } from "@/lib/edition/archive";
import { generateEditionPdf } from "@/lib/edition/pdf";
import { getPublicSampleEdition, SAMPLE_EDITION_ID } from "@/lib/edition/sample";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: editionId } = await params;
    if (!editionId) {
      return new Response("Edition ID required", { status: 400 });
    }

    // Public sample edition PDF download (no authentication required)
    if (editionId === "sample" || editionId === SAMPLE_EDITION_ID) {
      const sampleEdition = getPublicSampleEdition();
      const pdfBuffer = await generateEditionPdf(sampleEdition);
      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Herald-Sample-Edition.pdf"`,
          "Cache-Control": "public, max-age=3600",
          "Content-Length": String(pdfBuffer.length),
        },
      });
    }

    // 1. Resolve Supabase client and authenticate reader (supporting both session cookies and Bearer tokens)
    const authHeader = request.headers.get("Authorization");
    let supabase;
    let user = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const client = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      );
      const {
        data: { user: tokenUser },
      } = await client.auth.getUser(token);
      user = tokenUser;
      supabase = client;
    } else {
      const serverClient = await createServerSupabase();
      const {
        data: { user: cookieUser },
      } = await serverClient.auth.getUser();
      user = cookieUser;
      supabase = serverClient;
    }

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Fetch the preserved completed Edition owned by this reader
    // Uses getArchivedEditionById which enforces reader ownership and completed status
    // Does NOT call news supply, AI, or reranking APIs
    const edition = await getArchivedEditionById(supabase, user.id, editionId);

    if (!edition) {
      // Return 404 to avoid leaking whether another reader owns this edition ID
      return new Response("Edition not found or access denied", { status: 404 });
    }

    // 3. Render traditional newspaper PDF from preserved snapshot
    const pdfBuffer = await generateEditionPdf(edition);

    // 4. Return PDF with proper headers preventing caching and specifying download filename
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Herald-${edition.edition_date}.pdf"`,
        "Cache-Control": "private, no-store, must-revalidate",
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[Herald] Error generating PDF download:", error);
    return new Response("Failed to generate PDF", { status: 500 });
  }
}
