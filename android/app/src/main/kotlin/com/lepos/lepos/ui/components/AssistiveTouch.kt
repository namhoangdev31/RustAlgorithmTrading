package com.lepos.lepos.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@Composable
fun AssistiveTouch(
    onBack: () -> Unit = {},
    onHome: () -> Unit = {},
    onReload: () -> Unit = {}
) {
    var isExpanded by remember { mutableStateOf(false) }

    val offsetX = remember { Animatable(0f) }
    val offsetY = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .zIndex(100f)
    ) {
        val configuration = LocalConfiguration.current
        val density = LocalDensity.current

        val maxWidthPx = with(density) { configuration.screenWidthDp.dp.toPx() }
        val maxHeightPx = with(density) { configuration.screenHeightDp.dp.toPx() }

        // Initial Position: Center Left
        var isInitialPositionSet by remember { mutableStateOf(false) }
        val buttonSizePx = with(density) { 60.dp.toPx() }

        LaunchedEffect(maxHeightPx) {
            if (!isInitialPositionSet && maxHeightPx > 0) {
                offsetY.snapTo((maxHeightPx / 2) - (buttonSizePx / 2))
                offsetX.snapTo(20f) // Left side
                isInitialPositionSet = true
            }
        }



        AnimatedVisibility(
            visible = isExpanded,
            enter = scaleIn() + fadeIn(),
            exit = scaleOut() + fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Transparent)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { isExpanded = false }
            )

            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surfaceContainerHigh,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        MenuItem(icon = Icons.Default.Star, onClick = { 
                            isExpanded = false 
                            onReload()
                        })
                        Spacer(modifier = Modifier.height(16.dp))
                        MenuItem(
                            icon = Icons.Default.Notifications,
                            onClick = { 
                                isExpanded = false 
                                onHome()
                            })
                        Spacer(modifier = Modifier.height(16.dp))
                        MenuItem(icon = Icons.Default.Close, onClick = { 
                            isExpanded = false
                            onBack() 
                        })
                    }
                }
            }
        }

        AnimatedVisibility(
            visible = !isExpanded,
            enter = scaleIn() + fadeIn(),
            exit = scaleOut() + fadeOut()
        ) {
            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier
                    .offset { IntOffset(offsetX.value.roundToInt(), offsetY.value.roundToInt()) }
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragEnd = {
                                val currentX = offsetX.value
                                val center = maxWidthPx / 2
                                val targetX =
                                    if (currentX + 30.dp.toPx() < center) {
                                        20f
                                    } else {
                                        maxWidthPx - 60.dp.toPx() - 20f
                                    }

                                val btnSize = 60.dp.toPx()
                                val targetY =
                                    offsetY.value.coerceIn(80f, maxHeightPx - 80f - btnSize)

                                scope.launch {
                                    offsetX.animateTo(
                                        targetX,
                                        animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy)
                                    )
                                }
                                scope.launch {
                                    offsetY.animateTo(
                                        targetY,
                                        animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy)
                                    )
                                }
                            }
                        ) { change, dragAmount ->
                            change.consume()
                            scope.launch {
                                offsetX.snapTo(offsetX.value + dragAmount.x)
                                offsetY.snapTo(offsetY.value + dragAmount.y)
                            }
                        }
                    }
                    .size(60.dp)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { isExpanded = true }
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Menu,
                        contentDescription = "Assistive Touch",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    }
}

@Composable
fun MenuItem(icon: ImageVector, onClick: () -> Unit) {
    Surface(
        shape = CircleShape,
        color = MaterialTheme.colorScheme.tertiaryContainer,
        modifier = Modifier
            .size(50.dp)
            .clickable(onClick = onClick)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onTertiaryContainer
            )
        }
    }
}
