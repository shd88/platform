// Copyright (c) 2015 Spinpunch, Inc. All Rights Reserved.
// See License.txt for license information.

package model

import (
	"encoding/json"
	"fmt"
	"io"
	"regexp"
	"strings"
)

const (
	TEAM_OPEN   = "O"
	TEAM_INVITE = "I"
)

type Team struct {
	Id             string `json:"id"`
	CreateAt       int64  `json:"create_at"`
	UpdateAt       int64  `json:"update_at"`
	DeleteAt       int64  `json:"delete_at"`
	DisplayName    string `json:"display_name"`
	Name           string `json:"name"`
	Email          string `json:"email"`
	Type           string `json:"type"`
	CompanyName    string `json:"company_name"`
	AllowedDomains string `json:"allowed_domains"`
	AllowValet     bool   `json:"allow_valet"`
}

type Invites struct {
	Invites []map[string]string `json:"invites"`
}

func InvitesFromJson(data io.Reader) *Invites {
	decoder := json.NewDecoder(data)
	var o Invites
	err := decoder.Decode(&o)
	if err == nil {
		return &o
	} else {
		return nil
	}
}

func (o *Invites) ToJson() string {
	b, err := json.Marshal(o)
	if err != nil {
		return ""
	} else {
		return string(b)
	}
}

func (o *Team) ToJson() string {
	b, err := json.Marshal(o)
	if err != nil {
		return ""
	} else {
		return string(b)
	}
}

func TeamFromJson(data io.Reader) *Team {
	decoder := json.NewDecoder(data)
	var o Team
	err := decoder.Decode(&o)
	if err == nil {
		return &o
	} else {
		return nil
	}
}

func (o *Team) Etag() string {
	return Etag(o.Id, o.UpdateAt)
}

func (o *Team) IsValid() *AppError {

	if len(o.Id) != 26 {
		return NewAppError("Team.IsValid", "Invalid Id", "")
	}

	if o.CreateAt == 0 {
		return NewAppError("Team.IsValid", "Create at must be a valid time", "id="+o.Id)
	}

	if o.UpdateAt == 0 {
		return NewAppError("Team.IsValid", "Update at must be a valid time", "id="+o.Id)
	}

	if len(o.Email) > 128 {
		return NewAppError("Team.IsValid", "Invalid email", "id="+o.Id)
	}

	if len(o.Email) > 0 && !IsValidEmail(o.Email) {
		return NewAppError("Team.IsValid", "Invalid email", "id="+o.Id)
	}

	if len(o.DisplayName) > 64 {
		return NewAppError("Team.IsValid", "Invalid name", "id="+o.Id)
	}

	if len(o.Name) > 64 {
		return NewAppError("Team.IsValid", "Invalid URL Identifier", "id="+o.Id)
	}

	if IsReservedTeamName(o.Name) {
		return NewAppError("Team.IsValid", "This URL is unavailable. Please try another.", "id="+o.Id)
	}

	if !IsValidTeamName(o.Name) {
		return NewAppError("Team.IsValid", "Name must be 4 or more lowercase alphanumeric characters", "id="+o.Id)
	}

	if !(o.Type == TEAM_OPEN || o.Type == TEAM_INVITE) {
		return NewAppError("Team.IsValid", "Invalid type", "id="+o.Id)
	}

	if len(o.CompanyName) > 64 {
		return NewAppError("Team.IsValid", "Invalid company name", "id="+o.Id)
	}

	if len(o.AllowedDomains) > 500 {
		return NewAppError("Team.IsValid", "Invalid allowed domains", "id="+o.Id)
	}

	return nil
}

func (o *Team) PreSave() {
	if o.Id == "" {
		o.Id = NewId()
	}

	o.CreateAt = GetMillis()
	o.UpdateAt = o.CreateAt
}

func (o *Team) PreUpdate() {
	o.UpdateAt = GetMillis()
}

func IsReservedTeamName(s string) bool {
	s = strings.ToLower(s)

	for _, value := range reservedName {
		if strings.Index(s, value) == 0 {
			return true
		}
	}

	return false
}

func IsValidTeamName(s string) bool {

	if !IsValidAlphaNum(s) {
		return false
	}

	if len(s) <= 3 {
		return false
	}

	return true
}

var validTeamNameCharacter = regexp.MustCompile(`^[a-z0-9-]$`)

func CleanTeamName(s string) string {
	s = strings.ToLower(strings.Replace(s, " ", "-", -1))

	for _, value := range reservedName {
		if strings.Index(s, value) == 0 {
			s = strings.Replace(s, value, "", -1)
		}
	}

	s = strings.TrimSpace(s)

	for _, c := range s {
		char := fmt.Sprintf("%c", c)
		if !validTeamNameCharacter.MatchString(char) {
			s = strings.Replace(s, char, "", -1)
		}
	}

	s = strings.Trim(s, "-")

	if !IsValidTeamName(s) {
		s = NewId()
	}

	return s
}

func (o *Team) PreExport() {
}
