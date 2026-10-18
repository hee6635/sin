plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.eonjeswieo.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.eonjeswieo.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 74
        versionName = "0.64"
    }

    signingConfigs {
        // 시험용 고정 키: 저장소의 keystore/test.keystore (매번 같은 키로 서명 → 업데이트해도 데이터 유지, 구글 로그인 SHA-1 고정)
        // 스토어 출시용 키는 따로 만들어 GitHub Secrets 로 넣습니다 (RELEASE_STORE_FILE 등).
        create("test") {
            storeFile = rootProject.file("keystore/test.keystore")
            storePassword = "eonjeswieo"
            keyAlias = "eonjeswieo"
            keyPassword = "eonjeswieo"
        }
        create("release") {
            val f = System.getenv("RELEASE_STORE_FILE")
            if (f != null) {
                storeFile = file(f)
                storePassword = System.getenv("RELEASE_STORE_PASSWORD")
                keyAlias = System.getenv("RELEASE_KEY_ALIAS")
                keyPassword = System.getenv("RELEASE_KEY_PASSWORD")
            } else if (project.hasProperty("allowTestSigning")) {
                // CI 에서 "출시용 빌드가 되는지"만 점검할 때 (-PallowTestSigning=true). 이렇게 만든 앱은 출시에 쓰면 안 됨
                storeFile = rootProject.file("keystore/test.keystore")
                storePassword = "eonjeswieo"
                keyAlias = "eonjeswieo"
                keyPassword = "eonjeswieo"
            }
            // 둘 다 아니면 서명 정보를 비워 둠 → 출시용 빌드가 "서명 키가 없다"며 실패함
            // (공개된 시험 키로 출시용 앱이 조용히 만들어지지 않게)
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("test")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    // 구글 드라이브 백업: 계정 권한(drive.appdata) 받기
    implementation("com.google.android.gms:play-services-auth:21.2.0")
    // 푸시 알림(앱을 안 켜도 가족 메모 · 근무 요청 알림)
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-messaging")
    // 구글 로그인(폰을 바꿔도 가족방 찾기): 안드로이드 로그인 창 → 구글 신분증(ID token)
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
}
