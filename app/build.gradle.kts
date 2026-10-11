plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.eonjeswieo.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.eonjeswieo.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 14
        versionName = "0.12"
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
            } else {
                storeFile = rootProject.file("keystore/test.keystore")
                storePassword = "eonjeswieo"
                keyAlias = "eonjeswieo"
                keyPassword = "eonjeswieo"
            }
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
}
