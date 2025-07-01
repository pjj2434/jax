import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadRouter } from "@/lib/uploadthing";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const data = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!data || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Debug environment variables
    console.log('UPLOADTHING_SECRET available:', !!process.env.UPLOADTHING_SECRET);
    console.log('UPLOADTHING_TOKEN available:', !!process.env.UPLOADTHING_TOKEN);
    console.log('UPLOADTHING_APP_ID available:', !!process.env.UPLOADTHING_APP_ID);

    const body = await request.json();
    const { fileUrls } = body;

    if (!fileUrls || !Array.isArray(fileUrls)) {
      return NextResponse.json({ error: "fileUrls array is required" }, { status: 400 });
    }

    const results = [];
    
    for (const fileUrl of fileUrls) {
      try {
        // Extract the file key from the URL
        const urlParts = fileUrl.split('/');
        const fileKey = urlParts[urlParts.length - 1];
        
        if (!fileKey) {
          console.error('Could not extract file key from URL:', fileUrl);
          results.push({ url: fileUrl, success: false, error: 'Invalid URL' });
          continue;
        }

        console.log('Attempting to delete file with key:', fileKey);
        console.log('Using API Key:', process.env.UPLOADTHING_SECRET ? 'Present' : 'Missing');
        console.log('Using App ID:', process.env.UPLOADTHING_APP_ID ? 'Present' : 'Missing');

        // Call UploadThing's delete API with the correct format
        const response = await fetch(`https://uploadthing.com/api/deleteFiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Uploadthing-Api-Key': process.env.UPLOADTHING_SECRET || '',
            'X-Uploadthing-App-Id': process.env.UPLOADTHING_APP_ID || '',
          },
          body: JSON.stringify({
            fileKeys: [fileKey],
          }),
        });

        console.log('UploadThing delete response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to delete file from UploadThing:', response.status, errorText);
          results.push({ url: fileUrl, success: false, error: errorText });
        } else {
          const result = await response.json();
          console.log('Successfully deleted file from UploadThing:', fileKey, result);
          results.push({ url: fileUrl, success: true });
        }
             } catch (error) {
         console.error('Error deleting file from UploadThing:', error);
         results.push({ url: fileUrl, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
       }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`Deleted ${successful}/${fileUrls.length} files from UploadThing`);

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        total: fileUrls.length,
        successful,
        failed: fileUrls.length - successful
      }
    });
  } catch (error) {
    console.error("Error in delete files API:", error);
    return NextResponse.json({ error: "Failed to delete files" }, { status: 500 });
  }
} 