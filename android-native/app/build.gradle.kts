plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.lumina.studyflow"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.lumina.studyflow"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        // Desugaring for java.time.* on API < 26 (safe guard)
        isCoreLibraryDesugaringEnabled = true
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        // Kotlin 1.9.22 → compiler extension 1.5.10
        kotlinCompilerExtensionVersion = "1.5.10"
    }
}

dependencies {
    // Desugaring (java.time.*)
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")

    // Core & Compose
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.3")
    implementation("androidx.activity:activity-compose:1.9.1")

    // Compose BOM 2024.09 — includes Material3 with PullToRefreshBox & AnimatedContent
    implementation(platform("androidx.compose:compose-bom:2024.09.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.foundation:foundation")  // HorizontalPager for IntroScreen

    // Splash screen API (Android 12+ OS-level splash)
    implementation("androidx.core:core-splashscreen:1.0.1")

    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Supabase & Authentication
    val supabaseVersion = "3.0.2"
    implementation("io.github.jan-tennert.supabase:postgrest-kt:$supabaseVersion")
    implementation("io.github.jan-tennert.supabase:auth-kt:$supabaseVersion")
    implementation("io.github.jan-tennert.supabase:functions-kt:$supabaseVersion")
    implementation("io.github.jan-tennert.supabase:compose-auth:$supabaseVersion")
    implementation("io.github.jan-tennert.supabase:realtime-kt:$supabaseVersion")

    // Android Credential Manager (native Google Sign-In)
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // Ktor HTTP engine
    implementation("io.ktor:ktor-client-android:3.0.1")

    // Debug tooling
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
