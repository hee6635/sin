package androidx.activity.result.contract;
import androidx.activity.result.*;
public class ActivityResultContracts {
  public static class GetContent extends ActivityResultContract<String, android.net.Uri> { }
  public static class StartActivityForResult extends ActivityResultContract<android.content.Intent, ActivityResult> { }
  public static class StartIntentSenderForResult extends ActivityResultContract<IntentSenderRequest, ActivityResult> { }
  public static class PickVisualMedia extends ActivityResultContract<PickVisualMediaRequest, android.net.Uri> {
    public interface VisualMediaType { }
    public static final class ImageOnly implements VisualMediaType { public static final ImageOnly INSTANCE = new ImageOnly(); }
  }
}
