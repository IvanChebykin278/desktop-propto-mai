sap.ui.define([], function () {
	"use strict";
	return {
		stuffName: function (sName) {
			
			if(!sName) {
				return 'Сотрудник не выбран'
			}
			
			return sName;
		},
		
		stuffStatus: function(sStatus) {
			switch(sStatus) {
				case 'access':
					return 'Success';
				case 'busy':
					return 'Warning';
				case 'inaccessible':
					return 'Error';
				case 'lose':
					return 'None';
				default:
					return 'None';
			}
		},
		
		stuffIcon: function(sStatus) {
			switch(sStatus) {
				case 'access':
					return 'sap-icon://employee-approvals';
				case 'busy':
					return 'sap-icon://employee';
				case 'inaccessible':
					return 'sap-icon://employee-rejections';
				case 'lose':
					return 'sap-icon://employee-lookup';
				default:
					return 'sap-icon://alert';
			}
		},
		
		isMyPosition: function(flag) {
			return !flag
		},
		
		myPositionText: function(oPosition) {
			if(oPosition) {
				var lat = Math.floor(oPosition.lat * 1000) / 1000;
				var lng = Math.floor(oPosition.lng * 1000) / 1000;
				
				return `${lat} ${lng}`;
			}
			
			return 'Координаты не указаны'
		},
		
		myPositionStatus: function(oPosition) {
			if(oPosition) {
				return 'Success';
			}
			
			return 'Error';
		},
		
		myPositionIcon: function(oPosition) {
			if(oPosition) {
				return 'sap-icon://accept';
			}
			
			return 'sap-icon://decline'
		},
		
		enabledSubmit: function(oView) {
			debugger;
			return oView.isMyPosition && Boolean(oView.myPosition) || !oView.isMyPosition;
			
		}
	};
});