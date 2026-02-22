import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUploadUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');
  const contentType = searchParams.get('contentType');

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: 'fileName and contentType are required' },
      { status: 400 }
    );
  }

  try {
    const { uploadUrl, fileUrl } = await getUploadUrl(fileName, contentType);
    return NextResponse.json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error('Upload presign error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
