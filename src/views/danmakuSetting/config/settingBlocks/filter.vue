<template>
	<template v-if="settingTarget !== 'web'">
		<row-frame title="过滤器" :flex="true" contentClass="form-row">
			<row-span :span="6"> 开启过滤 </row-span>
			<row-span :span="6">
				<el-switch v-model="setting.filter.open" />
			</row-span>
			<!-- <row-span :span="3" :class="{disabled:!setting.filter.open}">
			游客过滤
		</row-span> -->
			<!-- <row-span :span="3">
			<el-switch v-model="setting.filter.visitor" :disabled="!setting.filter.open" />
		</row-span> -->
		</row-frame>
		<row-frame :flex="true" contentClass="form-row">
			<row-span :span="6" :class="{ disabled: !setting.filter.open }"> 牌子过滤 </row-span>
			<row-span :span="6">
				<el-switch v-model="setting.filter.clubOnly" :disabled="!setting.filter.open" />
			</row-span>
			<row-span :span="6" :class="{ disabled: !setting.filter.open }"> 等级过滤 </row-span>
			<row-span :span="6">
				<el-input-number :disabled="!setting.filter.open" style="margin-left: 8px" v-model="setting.clubLevel" :min="0" :step="1" />
			</row-span>
			<div class="hint">
				牌子过滤：只显示挂主播牌子的弹幕（主播没牌子则不生效）；<br />
				等级过滤：只显示大于一定等级的牌子的弹幕
			</div>
		</row-frame>
		<row-frame :flex="true" contentClass="form-row">
			<row-span :span="3" :class="{ disabled: !setting.filter.open }"> 黑名单 </row-span>
			<row-span :span="3">
				<el-switch :disabled="!setting.filter.open" v-model="setting.filter.blackList" />
			</row-span>
			<row-span :span="3" :class="{ disabled: !setting.filter.open }"> 关键词屏蔽 </row-span>
			<row-span :span="3">
				<el-switch :disabled="!setting.filter.open" v-model="setting.filter.keyword" />
			</row-span>
		</row-frame>
		<row-frame :flex="true">
			<row-span :span="3" :class="{ disabled: !setting.filter.open }"> 弹幕显示 </row-span>
			<row-span :span="9" v-show="setting.filter.blackList">
				<el-select :disabled="!setting.filter.open" v-model="setting.filter.types" multiple style="width: 100%" placeholder="多选显示弹幕类型">
					<el-option v-for="type in typeOptions" :label="type.label" :key="type.value" :value="type.value" />
				</el-select>
			</row-span>
		</row-frame>
	</template>
	<template v-else>
		<row-frame title="过滤器" :flex="true" contentClass="form-row">
			<div class="hint">客户端的过滤器跟随主播端设置</div>
		</row-frame>
		<row-frame title="发送弹幕测试">
			<el-select v-model="styleType" placeholder="选择弹幕类型" @change="sendDanmaku">
				<el-option v-for="type in typeOptions" :label="type.label" :key="type.value" :value="type.value" />
			</el-select>

			<!-- <el-button-group>
				<el-button v-for="type in typeOptions" :label="type.value" :key="type.value" @click="sendDanmaku(type.value)">{{ type.label }} </el-button>
			</el-button-group> -->
			<div class="hint">开播前可以用这个测一下</div>
		</row-frame>
	</template>
	<row-frame title="弹幕合并" :flex="true" contentClass="form-row">
		<row-span :span="3" :class="{ disabled: !setting.filter.open }"> 礼物连击 </row-span>
		<row-span :span="3">
			<el-switch :disabled="!setting.filter.open" v-model="setting.filter.combineGift" />
		</row-span>
		<row-span :span="3" :class="{ disabled: !setting.filter.open }"> 点赞 </row-span>
		<row-span :span="3">
			<el-switch :disabled="!setting.filter.open" v-model="setting.filter.combineLike" />
		</row-span>
	</row-frame>
	<row-frame title="" :flex="true" contentClass="form-row">
		<row-span :span="3" :class="{ disabled: !setting.filter.open }"> 进入直播间 </row-span>
		<row-span :span="3">
			<el-switch :disabled="!setting.filter.open" v-model="setting.filter.combineEnter" />
		</row-span>
		<div class="hint">合并：针对一定时期内相同用户发出的相同类型弹幕进行合并</div>
	</row-frame>
</template>

<script lang="ts">
import { typeOptions } from "@front/components/danmakuFlow/utils/data";
import { defineComponent } from "vue";
import { wsevent } from "@front/api";

import contentFrame from "@front/components/base/frames/contentFrame.vue";
import rowFrame from "@front/components/base/frames/rowFrame.vue";
import rowSpan from "@front/components/base/frames/rowSpan.vue";

export default defineComponent({
	components: {
		contentFrame,
		rowFrame,
		rowSpan
	},
	props: {
		settings: {
			required: true
		},
		mockData: {
			default: () => {
				return [];
			}
		},
		settingTarget: {
			default: "toolBox"
		}
	},
	data() {
		return {
			styleType: ""
		};
	},
	computed: {
		typeOptions,
		setting: {
			get(): any {
				return this.settings;
			},
			set(e: any) {
				this.$emit("update:settings", e);
			}
		}
	},
	methods: {
		sendDanmaku(value: number) {
			console.log(value);
			wsevent.wsEmit("sendMockDanmaku", value, "danmakuWeb");
		}
	}
});
</script>
<style lang="scss">
.form-row {
	align-items: center;
}
</style>
